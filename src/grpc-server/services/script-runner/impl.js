import scriptMaker from './script-maker'
import executor from './executor'
import context from './context'
import grpc from "grpc"
import {Compose, Messaging, System} from './rest-clients'
import logger from '../../../logger'
import {services as servicesConfig} from '../../../config'
import { Abort } from 'corteza-webapp-common/src/lib/corredor/errors'

let apiClients = {
  compose: Compose(servicesConfig.scriptRunner.apiClients.compose),
  messaging: Messaging(servicesConfig.scriptRunner.apiClients.messaging),
  system: System(servicesConfig.scriptRunner.apiClients.system),
}

const setupScriptRunner = async (elog, request = {}) => {
  let vmScript
    , { script = '' } = request

  try {
    vmScript = scriptMaker(script)
  } catch(e) {
    return Promise.reject(e)
  }

  elog.debug({ source: script.source },'executing the script')
  return executor(vmScript, context(request, apiClients))
}

const handleError = (logger, done) => (e) => {
  if (e instanceof SyntaxError) {
    // SyntaxError
    //
    // when something is wrong in the automatino script
    done({ message: e.message + '\n\n' + e.stack, code: grpc.status.INVALID_ARGUMENT })
    logger.error({ stack: e.stack }, e.message)
  } else if (e instanceof Abort) {
    // Abort
    //
    // Custom error provided to automation scripts to
    // allow more control over script execution flow
    done({ message: e.message || 'Aborted', code: grpc.status.ABORTED })
    logger.error({ stack: e.stack }, e.message)
  } else if (e instanceof Error) {
    // Error
    //
    // General error handling
    done({ message: e.message + '\n\n' + e.stack, code: grpc.status.INTERNAL })
    logger.error({ stack: e.stack }, e.message)
  } else if (typeof e === 'string') {
    // (string)
    //
    // Properly handle code that does `throw 'foo'`
    done({ message: e, code: grpc.status.ABORTED })
    logger.error(e)
  }
}

const enrichLogger = (logger, request = {}) =>  {
  const {
    script,
    record,
    namespace,
    module,
  } = request

  return logger.child({
    triggerID: script.ref ? String(script.ref) : undefined,
    namespaceID: namespace.namespaceID ? String(namespace.namespaceID) : undefined,
    moduleID: module.moduleID ? String(module.moduleID) : undefined,
    recordID: record.recordID ? String(record.recordID) : undefined,
  })
}

const logCall = (logger) => {
  const s = new Date()
  return () => {
    const duration = (new Date()).getTime() - s.getTime()
    logger.info({duration}, 'done')
  }
}

// Testing the script
export default () => {
  return {
    Test ({request}, done) {
      let elog = enrichLogger(logger, request)
      try {
        scriptMaker(request).compile()
        done(null, {})
      } catch (e) {
        handleError(elog, done)(e)
      } finally {
        logCall(elog)()
      }
    },

    // Namespace automation scripts
    Namespace ({request}, done) {
      let elog = enrichLogger(logger, request)
      setupScriptRunner(elog, request).then(namespace => {
        if (!namespace) {
          elog.info('namespace value not set, aborting')
          done(null, {})
        }

        elog.debug({namespace}, 'returning namespace')
        done(null, {namespace: namespace})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },

    // Module automation scripts
    Module ({request}, done) {
      let elog = enrichLogger(logger, request)
      setupScriptRunner(elog, request).then(module => {
        if (!module) {
          elog.info('module value not set, aborting')
          done(null, {})
        }

        elog.debug({module}, 'returning module')
        done(null, {module: module})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },

    // Record automation script execution
    Record ({request}, done) {
      let elog = enrichLogger(logger, request)
      setupScriptRunner(elog, request).then(record => {
        if (!record) {
          elog.info('record value not set, aborting')
          done(null, {})
        }

        // remove module obj before logging
        elog.debug({ ...record, module: undefined }, 'returning record')

        // remove module obj & serialize values before sending back to caller
        record = {...record, module: undefined, values: record.serializeValues()}

        done(null, {record})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },
  }
}

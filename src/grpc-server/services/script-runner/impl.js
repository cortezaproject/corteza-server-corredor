import grpc from "grpc"
import { sharedContext } from 'corteza-webapp-common/src/lib/automation-scripts/context'
import executor from 'corteza-webapp-common/src/lib/automation-scripts/exec-in-vm'
import { Abort } from 'corteza-webapp-common/src/lib/automation-scripts/context/errors'
import {Compose, Messaging, System} from './rest-clients'
import logger from '../../../logger'
import {services as servicesConfig, debug} from '../../../config'

const timeouts = servicesConfig.scriptRunner.timeout

let apiClients = {
  ComposeAPI: Compose(servicesConfig.scriptRunner.apiClients.compose),
  MessagingAPI: Messaging(servicesConfig.scriptRunner.apiClients.messaging),
  SystemAPI: System(servicesConfig.scriptRunner.apiClients.system),
}

const setupScriptRunner = async (elog, request = {}) => {
  let { script = {} } = request

  let { timeout } = script

  if (timeout > timeouts.max) {
    timeout = timeouts.max
  } else if (timeout < timeouts.min) {
    timeout = timeouts.min
  }



  const ctx = {
    ...request,
    ...apiClients,
  }

  elog.debug({ source: script.source },'executing the script')
  return executor(
    script.source,
    sharedContext(ctx),
    {
      timeout,
      // For now, debug is the only thing that controls how we handle console.*
      // calls.
      // @todo how can we capture console output and
      //       serve it back with gRPC response?
      //       https://stackoverflow.com/a/50333959
      console: debug ? 'inherit' : 'off',

    })
}

const handleError = (logger, done) => (e) => {
  if (e instanceof SyntaxError) {
    // SyntaxError
    //
    // when something is wrong in the automatino script
    done({ message: e.message + '\n\n' + e.stack, code: grpc.status.FAILED_PRECONDITION })
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
    triggerID: script && script.ref ? String(script.ref) : undefined,
    namespaceID: namespace && namespace.namespaceID ? String(namespace.namespaceID) : undefined,
    moduleID: module && module.moduleID ? String(module.moduleID) : undefined,
    recordID: record && record.recordID ? String(record.recordID) : undefined,
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
        // @todo
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

import grpc from "grpc"
import execInVM from 'corteza-webapp-common/src/lib/automation-scripts/exec-in-vm'
import { Abort } from 'corteza-webapp-common/src/lib/automation-scripts/context/errors'
import Record from 'corteza-webapp-common/src/lib/types/compose/record'
import ComposeApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/compose'
import MessagingApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/messaging'
import SystemApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/system'

import logger from '../../../logger'
import {services as servicesConfig, debug} from '../../../config'

const timeouts = servicesConfig.scriptRunner.timeout

const setupScriptRunner = async (elog, request = {}) => {
  let { script = {} } = request

  let { timeout } = script

  if (timeout > timeouts.max) {
    timeout = timeouts.max
  } else if (timeout < timeouts.min) {
    timeout = timeouts.min
  }

  const ctx = { ...request }

  // Scan config map and try to configure API clients
  const cfg = (request.config || {})
  const jwt = cfg['api.jwt']

  // If we got the JWT and we know the base URL for each
  // client/service we can configure the API client
  if (jwt) {
    if (cfg['api.baseURL.compose']) {
      ctx.ComposeAPI = new ComposeApiClient({ baseURL: cfg['api.baseURL.compose'], jwt })
    }

    if (cfg['api.baseURL.messaging']) {
      ctx.MessagingAPI = new MessagingApiClient({ baseURL: cfg['api.baseURL.messaging'], jwt })
    }

    if (cfg['api.baseURL.system']) {
      ctx.SystemAPI = new SystemApiClient({ baseURL: cfg['api.baseURL.system'], jwt })
    }
  }

  ctx.SystemAPI.authCheck().then(({ user }) => {
    ctx.authUser = user

    elog.debug({ source: script.source },'executing the script')

    return execInVM(
      script.source,
      ctx,
      {
        timeout,
        // For now, debug is the only thing that controls how we handle console.*
        // calls.
        // @todo how can we capture console output and
        //       serve it back with gRPC response?
        //       https://stackoverflow.com/a/50333959
        //       https://www.oipapio.com/question-4759570
        console: debug ? 'inherit' : 'off',
      })
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
        if (record && record instanceof Record) {
          record = {...record, module: undefined, values: record.serializeValues()}
        } else {
          record = {}
        }

        done(null, {record})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },
  }
}

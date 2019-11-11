import grpc from "grpc"
import execInVM from 'corteza-webapp-common/src/lib/automation-scripts/exec-in-vm'
import { Abort } from 'corteza-webapp-common/src/lib/automation-scripts/context/errors'
import Namespace from 'corteza-webapp-common/src/lib/types/compose/namespace'
import Module from 'corteza-webapp-common/src/lib/types/compose/module'
import Record from 'corteza-webapp-common/src/lib/types/compose/record'
import ComposeApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/compose'
import MessagingApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/messaging'
import SystemApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/system'

import logger from '../../../logger'
import {services as servicesConfig, debug} from '../../../config'

const timeouts = servicesConfig.scriptRunner.timeout

const initApiClients = (cfg) => {
  const ctx = {
    ComposeAPI: null,
    MessagingAPI: null,
    SystemAPI: null,
  }
  // Scan config map and try to configure API clients
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

  return ctx
}

const setupScriptRunner = async (elog, script, ctx = {}) => {
  let { timeout } = script

  if (timeout > timeouts.max) {
    timeout = timeouts.max
  } else if (timeout < timeouts.min) {
    timeout = timeouts.min
  }

  return ctx.SystemAPI.authCheck().then(({ user }) => {
    ctx.$authUser = user

    elog.debug({
      source: script.source,
    },'executing the script')

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
    logger.error({ stack: e.stack }, e.message)
    done({
      code: grpc.status.FAILED_PRECONDITION,
      message: e.message + '\n\n' + e.stack,
    })
  } else if (e instanceof Abort) {
    // Abort
    //
    // Custom error provided to automation scripts to
    // allow more control over script execution flow
    logger.error({ stack: e.stack }, e.message)
    done({
      code: grpc.status.ABORTED,
      message: e.message || 'Aborted',
    })
  } else if (e instanceof Error) {
    // Error
    //
    // General error handling
    logger.error({ stack: e.stack }, e.message)
    done({
      code: grpc.status.INTERNAL,
      message: e.message + '\n\n' + e.stack,
    })
  } else if (typeof e === 'string') {
    // (string)
    //
    // Properly handle code that does `throw 'foo'`
    logger.error(e)
    done({
      code: grpc.status.ABORTED,
      message: e,
    })
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

/**
 * Converts input to protobuf `google.protobuf.Timestamp` type
 * @param input {Object|string|number}
 * @returns {Object}
 */
const convTimestamp = (input) => {
  let ms = 0
  if (input instanceof Date) {
    ms = input.getTime()
  } else if (typeof input === 'string') {
    ms = Date.parse(input)
  } else if (typeof input === 'number') {
    ms = input
  }

  return {
    seconds: Math.floor(ms / 1000),
    nanos: (ms % 1000) * 1e6
  }
}

/**
 * Convets obj props (std. set) that hold datetime-like values
 * @param obj {Object}
 */
const convTimestampSet = (obj) => {
  ['createdAt', 'updatedAt', 'deletedAt'].forEach(prop => {
    if (obj[prop]) {
      obj[prop] = convTimestamp(obj[prop])
    }
  })
}

export default () => {
  return {
    // Testing the script
    Test({request}, done) {
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
    Namespace({request}, done) {
      let elog = enrichLogger(logger, request)

      let {
        config,
        script,
        namespace,
      } = request

      let ctx = {
        ...initApiClients(config),
        $namespace: new Namespace(namespace),
      }

      setupScriptRunner(elog, script, ctx).then(ok => {
        if (!ok) {
          elog.info('namespace value not set, aborting')
          done(null, {})
        }

        elog.debug({namespace}, 'returning namespace')
        done(null, {namespace: ctx.$namespace})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },

    // Module automation scripts
    Module({request}, done) {
      let elog = enrichLogger(logger, request)

      let {
        config,
        script,
        namespace,
        module,
      } = request

      let ctx = {
        ...initApiClients(config),
        $namespace: new Namespace(namespace),
        $module: new Module(module),
      }

      setupScriptRunner(elog, script, ctx).then(ok => {
        if (!ok) {
          elog.info('module value not set, aborting')
          done(null, {})
        }

        elog.debug({module}, 'returning module')
        done(null, {module: ctx.$module})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },

    // Record automation script execution
    Record({request}, done) {
      let elog = enrichLogger(logger, request)

      let {
        config,
        script,
        namespace,
        module,
        record,
      } = request

      const $namespace = namespace ? new Namespace(namespace) : undefined
      const $module = module ? new Module(module) : undefined
      const $record = $module && record ? new Record($module, record) : undefined

      let ctx = {
        ...initApiClients(config),
        $namespace,
        $module,
        $record,
      }

      setupScriptRunner(elog, script, ctx).then(ok => {
        if (!ok) {
          elog.info('record value not set, aborting')
          done(null, {})
        }

        let record = ctx.$record

        // remove module obj before logging
        elog.debug({...record, module: undefined}, 'returning record')

        // remove module obj & serialize values before sending back to caller
        if (record && record instanceof Record) {
          record = {...record, module: undefined, values: record.serializeValues()}
        } else {
          record = {}
        }

        convTimestampSet(record)

        done(null, {record})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },

    MailMessage({request}, done) {
      let elog = enrichLogger(logger, request)

      let {
        config,
        script,
        mailMessage,
      } = request

      // Normalize mail message header & body
      let header = mailMessage.header
      for (var name of Object.keys(header.raw)) {
        header.raw[name] = header.raw[name].values
      }

      let [ from ] = header.raw.From || [ undefined ]
      let [ to ] = header.raw.To || [ undefined ]
      let [ subject ] = header.raw.Subject || [ undefined ]
      let [ messageID ] = header.raw['Message-Id'] || [ undefined ]
      let rawBody = mailMessage.rawBody.toString()
      let $mailMessage = Object.seal({ header, rawBody, subject, to, from, messageID })

      let ctx = { ...initApiClients(config), $mailMessage }

      setupScriptRunner(elog, script, ctx).then(ok => {
        if (!ok) {
          elog.info('aborted')
        }

        elog.info('done')
        done(null, {})
      }).catch(handleError(elog, done)).finally(logCall(elog))
    },
  }
}

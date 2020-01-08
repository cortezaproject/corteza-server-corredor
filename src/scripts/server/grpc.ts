import grpc from 'grpc'
import pino, { BaseLogger } from 'pino'
import { HandleException } from '../../grpc-server'
import { Service } from './service'
import { LogToArray } from '../log-to-array'
import { Args, BaseArgs } from '../exec'
import { cortezaTypes } from '../exec/args-corteza'

interface KV {
  [_: string]: string;
}

interface ExecRequestWrap {
  request: ExecRequest;
  metadata: grpc.Metadata;
}

interface ExecRequest {
  name: string;
  args?: KV;
}

interface ExecResponse {
  result: object;
}

interface ListRequestWrap {
  request: ListRequest;
  metadata: grpc.Metadata;
}

interface ListRequest {
  query?: string;
  resource?: string;
  events?: string[];
  security?: number;
}

interface ListResponse {
  scripts: object[];
}

interface ExecArgsRaw {
  jwt?: string;
  [_: string]: unknown;
}

/**
 * Decodes exec arguments
 *
 * It assumes values of all properties in the
 * passed object are strings with encoded JSON
 *
 * @param {object} args
 * @returns {object} parsed arguments
 */
export function decodeExecArguments (args: KV|undefined): ExecArgsRaw {
  if (!args) {
    return {}
  }

  for (const k in args) {
    if (!Object.prototype.hasOwnProperty.call(args, k)) {
      continue
    }

    try {
      args[k] = JSON.parse(args[k])
    } catch (e) {
      throw new Error(`Could not parse argument ${k}: ${e}`)
    }
  }

  return args
}

export function encodeExecResult (args: object): KV {
  const enc: KV = {}

  for (const k in args) {
    if (!Object.prototype.hasOwnProperty.call(args, k)) {
      continue
    }

    enc[k] = JSON.stringify(args[k])
  }

  return enc
}

export function Handlers (h: Service, loggerService: BaseLogger): object {
  return {
    Exec ({ request, metadata }: ExecRequestWrap, done: grpc.sendUnaryData<ExecResponse|null>): void {
      const started = Date.now()

      // name of the script & encoded arguments
      const { name, args: eArgs } = request

      const [requestId] = metadata.get('x-request-id')
      const logger = loggerService.child({ rpc: 'Exec', script: name, requestId })

      let dArgs: ExecArgsRaw = {}

      try {
        // Decode arguments
        // passed in as keys with JSON-encoded values
        logger.debug({ eArgs }, 'encoded arguments')
        dArgs = decodeExecArguments(eArgs)

        logger.debug('executing script %s', name)
      } catch (e) {
        HandleException(e, done, grpc.status.INVALID_ARGUMENT)
      }

      // global console replacement,
      // will allow us to catch console.* calls and return them to the caller
      const logBuffer = new LogToArray()
      const scriptLogger = pino({}, logBuffer)

      // Cast some of the common argument types
      // from plain javascript object to proper classes
      const args = new Args(dArgs, cortezaTypes)

      try {
        h.Exec(name, args as BaseArgs, scriptLogger).then((result) => {
          const meta = new grpc.Metadata()

          // Map each log line from the executed function to the metadata
          logBuffer.serialize().forEach((l: string) => {
            logger.debug(`${name} emitted log: ${l}`)
            meta.add('log', l)
          })

          done(null, { result: encodeExecResult(result) }, meta)
          logger.debug({
            duration: Date.now() - started
          }, 'done')
        }).catch(e => {
          logger.debug({ stack: e.stack }, e.message)
          HandleException(e, done, grpc.status.ABORTED)
        })
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.ABORTED)
      }
    },

    List ({ request }: ListRequestWrap, done: grpc.sendUnaryData<ListResponse|null>): void {
      const { query, resource, events } = request
      const logger = loggerService.child({ rpc: 'List' })

      const filter = {
        query,
        resource,
        events
      }

      logger.debug({ filter }, 'returning list of scripts')

      try {
        const scripts = h.List(filter)
        done(null, { scripts })
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.INTERNAL)
      }
    }
  }
}

import grpc from 'grpc'
import { Service } from './service'
import { HandleException } from '../../grpc/errors'
import { gRPCServiceExecResponse, gRPCServiceListResponse, ScriptSecurity } from './d'
import pino from 'pino'

interface IListRequest {
    query?: string;
    resource?: string;
    events?: string[];
    security?: number;
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
export function decodeExecArguments (args: object|undefined): object {
  if (!args) {
    return {}
  }

  for (const k in args) {
    try {
      // @ts-ignore
      args[k] = JSON.parse(args[k])
    } catch (e) {
      throw new Error(`Could not parse argument ${k}: ${e}`)
    }
  }

  return args
}

export function encodeExecResult (args: object): object {
  for (const k in args) {
    // @ts-ignore
    args[k] = JSON.stringify(args[k])
  }

  return args
}

export function Handlers (h: Service, logger: pino.BaseLogger) {
  return {
    Exec ({ request = {} }: any, done: grpc.sendUnaryData<gRPCServiceExecResponse|null>) {
      const { name, args } = request

      logger = logger.child({ rpc: 'Exec', script: name })
      try {
        // Decode arguments
        // passed in as keys with JSON-encoded values
        const dArgs = decodeExecArguments(args)

        h.Exec(name, dArgs).then(({ result, log }) => {
          const meta = new grpc.Metadata()

          // Map each log line from the executed function to the metadata
          log.forEach((l: string) => {
            logger.debug(`${name} emitted log: ${l}`)
            meta.add('log', l)
          })

          done(null, { result: encodeExecResult(result) }, meta)
        }).catch(e => {
          logger.debug(e.message, { stack: e.stack, args })
          HandleException(e, done)
        })
      } catch (e) {
        logger.debug(e.message, { stack: e.stack, args })
        HandleException(e, done)
      }
    },

    List ({ request = {} }, done: grpc.sendUnaryData<gRPCServiceListResponse|null>) {
      const grpcSecDefiner = 1
      const { query, resource, events, security }: IListRequest = request

      const filter = {
        query,
        resource,
        events,

        // translate protobuf's enum
        security: security === grpcSecDefiner
          ? ScriptSecurity.definer
          : ScriptSecurity.invoker
      }

      logger = logger.child({ rpc: 'List', filter })
      logger.debug('returning list of scripts')

      try {
        const scripts = h.List(filter)
        done(null, { scripts })
      } catch (e) {
        logger.debug(e.message, { stack: e.stack })

        HandleException(e, done)
      }
    }
  }
}

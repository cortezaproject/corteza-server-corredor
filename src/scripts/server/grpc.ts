/* eslint-disable @typescript-eslint/ban-ts-ignore */

import grpc from 'grpc'
import { Service } from './service'
import { HandleException } from '../../grpc'
import { ExecArgsRaw, GRPCServiceExecResponse, GRPCServiceListResponse, ScriptSecurity } from './d'
import pino from 'pino'

interface KV {
  [_: string]: string;
}

interface ListRequest {
    query?: string;
    resource?: string;
    events?: string[];
    security?: number;
}

interface ExecRequest {
  name: string;
  args?: KV;
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

    // @ts-ignore
    enc[k] = JSON.stringify(args[k])
  }

  return enc
}

export function Handlers (h: Service, logger: pino.BaseLogger): object {
  return {
    Exec ({ request }: { request: ExecRequest }, done: grpc.sendUnaryData<GRPCServiceExecResponse|null>): void {
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

    List ({ request }: { request: ListRequest }, done: grpc.sendUnaryData<GRPCServiceListResponse|null>): void {
      const grpcSecDefiner = 1
      const { query, resource, events, security } = request

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

/* eslint-disable @typescript-eslint/ban-ts-ignore */

import grpc from 'grpc'
import pino from 'pino'
import { HandleException } from '+grpc-server'
import { Script } from './';

interface BundleRequest {
  name: string;
}

interface BundleResponse {
  bundles: Bundle[];
}

interface Bundle {
  name: string;
  type: string;
  code: string;
}

interface ListRequest {
  query?: string;
  resource?: string;
  events?: string[];
  bundle?: string;
}

interface ListResponse {
  scripts: Script[];
}

export function Handlers (loggerService: pino.BaseLogger): object {
  return {
    Bundle ({ request }: { request: BundleRequest }, done: grpc.sendUnaryData<BundleResponse|null>): void {
      const { name } = request
      const logger = loggerService.child({ rpc: 'Bundle' })

      logger.debug({ name }, 'serving bundle')

      try {
        const r: BundleResponse = {
          bundles: [
            {
              name: 'dummy',
              type: 'dummy',
              code: '/* bundle content */'
            }
          ]
        }

        done(null, r)
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done)
      }
    },

    List ({ request }: { request: ListRequest }, done: grpc.sendUnaryData<ListResponse|null>): void {
      const { query, resource, events, bundle } = request
      const logger = loggerService.child({ rpc: 'List' })

      const filter = {
        query,
        resource,
        events,
        bundle
      }

      logger.debug({ filter }, 'returning list of scripts')

      try {
        const r: ListResponse = {
          scripts: [
            {
              name: 'dummy name',
              label: 'dummy label',
              description: 'dummy description',
              events: [],
              errors: []
            }
          ]
        }

        done(null, r)
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done)
      }
    }
  }
}

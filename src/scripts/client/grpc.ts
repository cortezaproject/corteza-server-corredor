/* eslint-disable @typescript-eslint/ban-ts-ignore */

import grpc from 'grpc'
import { BaseLogger } from 'pino'
import { HandleException } from '../../grpc-server'
import { Service } from './'
import { IsModifiedSince } from '../shared'

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

interface ListRequestWrap {
  request: ListRequest;
  metadata: grpc.Metadata;
}

interface ListRequest {
  query?: string;
  resourceType?: string;
  eventTypes?: string[];
  bundle?: string;
}

interface ListResponse {
  scripts: unknown[];
}

export function Handlers (h: Service, loggerService: BaseLogger): object {
  return {
    async Bundle ({ request }: { request: BundleRequest }, done: grpc.sendUnaryData<BundleResponse|null>): void {
      const { name } = request
      const logger = loggerService.child({ rpc: 'Bundle' })

      try {
        done(null, {
          bundles: [{
            name,
            type: 'scripts',
            code: h.Bundle(name).toString(),
          }],
        })
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.INTERNAL)
      }
    },

    List ({ request, metadata }: ListRequestWrap, done: grpc.sendUnaryData<ListResponse|null>): void {
      const { query, resourceType, eventTypes, bundle } = request
      const logger = loggerService.child({ rpc: 'List' })

      const filter = {
        query,
        resourceType,
        eventTypes,
        bundle,
      }

      if (!IsModifiedSince(h.lastUpdated, metadata)) {
        logger.debug('client scripts older than requested by if-modified-since header')
        done(null, { scripts: [] })
        return
      }

      logger.debug({ filter }, 'returning list of client scripts')

      try {
        done(null, {
          scripts: h.List(filter)
            .map(s => ({
              ...s,
              updatedAt: s.updatedAt.toISOString(),
            })),
        })
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.INTERNAL)
      }
    },
  }
}

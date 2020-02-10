import grpc from 'grpc'
import { BaseLogger } from 'pino'
import { HandleException } from '../grpc-server'
import Service from '../services/client-scripts'
import IsModifiedSince from './shared/is-modified-since'

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

export default function Handler (h: Service, logger: BaseLogger): object {
  logger = logger.child({ name: 'grpc.client-scripts' })

  return {
    Bundle ({ request }: { request: BundleRequest }, done: grpc.sendUnaryData<BundleResponse|null>): void {
      const { name } = request
      const log = logger.child({ rpc: 'Bundle' })

      let code = ''
      try {
        code = h.getBundle(name).toString()
      } catch (e) {
        log.error('Could not load requested bundle', e)
      }

      try {
        done(null, {
          bundles: [{
            name,
            type: 'scripts',
            code,
          }],
        })
      } catch (e) {
        log.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.INTERNAL)
      }
    },

    List ({ request, metadata }: ListRequestWrap, done: grpc.sendUnaryData<ListResponse|null>): void {
      const { query, resourceType, eventTypes, bundle } = request
      const log = logger.child({ rpc: 'List' })

      const filter = {
        query,
        resourceType,
        eventTypes,
        bundle,
      }

      if (!IsModifiedSince(h.lastUpdated, metadata)) {
        log.debug('client scripts older than requested by if-modified-since header')
        done(null, { scripts: [] })
        return
      }

      const scripts = h.list(filter)
        .map(s => ({
          ...s,
          updatedAt: s.updatedAt.toISOString(),
        }))

      log.debug({ filter, total: scripts.length }, 'returning list of client scripts')

      try {
        done(null, { scripts })
      } catch (e) {
        log.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.INTERNAL)
      }
    },
  }
}

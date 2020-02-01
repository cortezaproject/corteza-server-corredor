/* eslint-disable @typescript-eslint/ban-ts-ignore */

import grpc from 'grpc'
import * as scriptLoader from '../../scripts/loader'
import { BaseLogger } from 'pino'
import { HandleException } from '../../grpc-server'
import { Script, Service } from './'
import fs from 'fs'
import { ParseBundleFilename } from '../../support'

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
  resourceType?: string;
  eventTypes?: string[];
  bundle?: string;
}

interface ListResponse {
  scripts: Script[];
}

export function Handlers (h: Service, loggerService: BaseLogger): object {
  return {
    async Bundle ({ request }: { request: BundleRequest }, done: grpc.sendUnaryData<BundleResponse|null>): void {
      const { name } = request
      const logger = loggerService.child({ rpc: 'Bundle' })

      logger.debug({ name }, 'serving bundle')

      // create bundle with webpack
      // serve them here
      const filepaths: string[] = []

      for await (const r of scriptLoader.Finder(h.config.bundleoutput, new RegExp(/bundle\.js$/))) {
        filepaths.push(r.filepath)
      }

      if (!filepaths.length) {
        const r: BundleResponse = { bundles: [] }
        done(null, r)
      }

      const r: BundleResponse = {
        bundles: [],
      }

      filepaths.forEach((f: string) => {
        const content = fs.readFileSync(f)
        const { bundle, filename, ext } = ParseBundleFilename(f)

        if (filename !== '' && bundle === name) {
          const b: Bundle = {
            name: bundle,
            type: ext,
            code: content.toString(),
          }

          r.bundles.push(b)
        }
      })

      try {
        done(null, r)
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.INTERNAL)
      }
    },

    List ({ request }: { request: ListRequest }, done: grpc.sendUnaryData<ListResponse|null>): void {
      const { query, resourceType, eventTypes, bundle } = request
      const logger = loggerService.child({ rpc: 'List' })

      const filter = {
        query,
        resourceType,
        eventTypes,
        bundle,
      }

      logger.debug({ filter }, 'returning list of scripts')

      try {
        done(null, { scripts: h.List(filter) })
      } catch (e) {
        logger.debug({ stack: e.stack }, e.message)
        HandleException(e, done, grpc.status.INTERNAL)
      }
    },
  }
}

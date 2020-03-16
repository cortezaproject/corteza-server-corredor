/* eslint-disable @typescript-eslint/ban-ts-ignore */

import path from 'path'
import logger from './logger'
import * as config from './config'
import * as gRPCServer from './grpc-server'
import ClientScriptsHandler from './grpc-handlers/client-scripts'
import ServerScriptsHandler from './grpc-handlers/server-scripts'
import ClientScriptsService from './services/client-scripts'
import ServerScriptsService from './services/server-scripts'
import DependenciesService from './services/dependencies'
import EnvCheck from './check'
import ScriptLoader from './loader'
import { Watcher } from './types'

/**
 *
 * Main Corredor responsibilities
 *
 *  1. @todo load remote (git-repo) scripts (if not local)
 *  2. watch and reload dependencies (if src/package.json exists)
 *  3.  watch frontend-script changes, run tests (if any) and (re)bundle scripts
 *  4. watching backend-script changes and (re)link them to gRPC service
 *     @todo run tests?
 *  5. start gRPC server
 *
 * Misc:
 *   - secret management
 */

EnvCheck()

const { searchPaths } = config.extensions

// <search-path>/client-scripts/<bundle>/<path-to-script>/*.js
const clientScriptsLoader = new ScriptLoader(searchPaths, 'client-scripts', path.join('*', '**', '*.js'))
// <search-path>/server-scripts/<path-to-script>/*.js
const serverScriptsLoader = new ScriptLoader(searchPaths, 'server-scripts', path.join('**', '*.js'))

let clientScriptsService: ClientScriptsService
let serverScriptsService: ServerScriptsService
let dependenciesService: DependenciesService

const watchers: Array<Watcher> = []

if (config.extensions.clientScripts.enabled) {
  clientScriptsService = new ClientScriptsService({
    logger,
    loader: clientScriptsLoader,
    config: { bundler: config.bundler },
  })

  if (config.extensions.clientScripts.watch) {
    watchers.push(clientScriptsService)
  }
}

if (config.extensions.serverScripts.enabled) {
  const { cortezaServers: cServers, frontend } = config.execContext

  serverScriptsService = new ServerScriptsService({
    logger,
    loader: serverScriptsLoader,
    config: { cServers, frontend },
  })

  if (config.extensions.serverScripts.watch) {
    watchers.push(serverScriptsService)
  }
}

if (config.extensions.dependencies.autoUpdate) {
  dependenciesService = new DependenciesService({
    logger,
    searchPaths,
  })

  dependenciesService.watch(() => {
    // @todo can we be more selective about what should be reloaded
    serverScriptsService.process()
    clientScriptsService.process()
  })
}

gRPCServer
  .LoadDefinitions(path.join(config.protobuf.path, '/service-corredor.proto'))
  .then(def => gRPCServer.VerifyDefinitions(def))
  .then(corredor => {
    const serviceDefinitions: gRPCServer.ServiceDefinition = new Map()
    serviceDefinitions.set(
      // @ts-ignore
      corredor.ServerScripts.service,
      ServerScriptsHandler(
        serverScriptsService,
        logger.child({ name: 'gRPC.ServerScripts' }),
      ),
    )

    serviceDefinitions.set(
      // @ts-ignore
      corredor.ClientScripts.service,
      ClientScriptsHandler(
        clientScriptsService,
        logger.child({ name: 'gRPC.ClientScripts' }),
      ),
    )

    gRPCServer.Start(config.server, logger, serviceDefinitions)
  })
  .catch(e => {
    logger.warn('could not start gRPC server:', e.message)
  })

Promise.all([
  serverScriptsService.process(),
  clientScriptsService.process(),
])

watchers.forEach(w => w.watch())

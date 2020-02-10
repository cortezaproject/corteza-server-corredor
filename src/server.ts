/* eslint-disable @typescript-eslint/ban-ts-ignore */

import path from 'path'
import logger from './logger'
import * as config from './config'
import * as deps from './scripts/deps'
import * as serverScripts from './scripts/server'
import * as clientScripts from './scripts/client'
import * as gRPCServer from './grpc-server'
import clientScriptHandler from './grpc-handlers/client-scripts'
import serverScriptHandler from './grpc-handlers/server-scripts'
import EnvCheck from './check'
import Loader from './loader/loader'

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

// <search-path>/client-scripts/<bundle>/<path-to-script>/*.js
const clientScriptsLoader = new Loader(config.extensions.searchPaths, 'client-scripts', path.join('*', '**', '*.js'))
// <search-path>/server-scripts/<path-to-script>/*.js
const serverScriptsLoader = new Loader(config.extensions.searchPaths, 'server-scripts', path.join('**', '*.js'))

let clientScriptsService: clientScripts.Service
let serverScriptsService: serverScripts.Service

if (config.extensions.clientScripts.enabled) {
  clientScriptsService = new clientScripts.Service({
    logger,
    loader: clientScriptsLoader,
    config: { bundler: config.bundler },
  })
}

if (config.extensions.serverScripts.enabled) {
  serverScriptsService = new serverScripts.Service({
    logger,
    loader: serverScriptsLoader,
    config: { cServers: config.execContext.cortezaServers },
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
      serverScriptHandler(
        serverScriptsService,
        logger.child({ name: 'gRPC.ServerScripts' }),
      ),
    )

    serviceDefinitions.set(
      // @ts-ignore
      corredor.ClientScripts.service,
      clientScriptHandler(
        clientScriptsService,
        logger.child({ name: 'gRPC.ClientScripts' }),
      ),
    )

    gRPCServer.Start(config.server, logger, serviceDefinitions)
  })
  .catch(e => {
    logger.warn({ name: 'gRPC' }, 'could not start gRPC server: ', e.message)
  })

// Loads/Reloads all extensions in parallel
async function reloadExtensions (): Promise<unknown> {
  return Promise.all([
    clientScriptsService.process(),
    serverScriptsService.process(),
  ])
}

async function installDepsAndReloadExt (): Promise<unknown> {
  if (!config.extensions.dependencies.autoUpdate) {
    return
  }

  logger.info('installing dependencies from %s', config.extensions.dependencies.packageJSON)
  deps
    .Install(logger, config.extensions.dependencies)
    .then(() => reloadExtensions())
}

const ecs = config.extensions.clientScripts
const ess = config.extensions.serverScripts

if (ecs.enabled || ess.enabled) {
  // App entry point
  installDepsAndReloadExt().then(() => {
    if (config.extensions.dependencies.autoUpdate) {
      // Setup dependency watcher that installs
      // dependencies on change & reloads server-scripts
      return deps.Watcher(config.extensions.dependencies.packageJSON, installDepsAndReloadExt)
    }
  }).then(() => {
    // Setup serve & client script watchers
    // that will reload server-side scripts
    reloadExtensions()

    serverScriptsService.watch()
    clientScriptsService.watch()
  })
} else {
  logger.warn('running without enabled script services')
}

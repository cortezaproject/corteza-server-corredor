/* eslint-disable @typescript-eslint/ban-ts-ignore */

// @ts-ignore
import path from 'path'
import logger from './logger'
import * as config from './config'
import * as deps from './scripts/deps'
import * as serverScripts from './scripts/server'
import * as clientScripts from './scripts/client'
import * as gRPCServer from './grpc-server'
import { Script } from './scripts/server/types'

/**
 *
 * Main Corredor responsibilities
 *
 *  1. @todo load remote (git-repo) scripts (if not local)
 *  2. watch and reload dependencies (if src/package.json exists)
 *  3. @todo watch frontend-script changes, run tests (if any) and (re)bundle scripts
 *  4. watching backend-script changes and (re)link them to gRPC service
 *     @todo run tests?
 *  5. start gRPC server
 *
 * Misc:
 *   - secret management
 */

logger.debug('initializing client-scripts service')
const clientScriptsService = new clientScripts.Service()

logger.debug('initializing server-scripts service')
const serverScriptsService = new serverScripts.Service(config.scripts.exec)

logger.info('server-scripts service configured')
logger.debug(
  config.scripts.exec.cServers.system,
  'configuring cServer system API'
)
logger.debug(
  config.scripts.exec.cServers.compose,
  'configuring cServer compose API'
)
logger.debug(
  config.scripts.exec.cServers.messaging,
  'configuring cServer messaging API'
)

async function installDependencies (): Promise<deps.PackageInstallStatus[]> {
  logger.info('installing dependencies from %s', config.scripts.dependencies.packageJSON)
  return deps.Install(logger, config.scripts.dependencies)
}

async function reloadServerScripts (): Promise<void> {
  // Reload scripts every-time packages change!
  logger.info('reloading server scripts')
  return serverScripts.Reloader(config.scripts.server.basedir)
    .then((scripts: Script[]) => {
      const isValid = (s: Script): boolean => !!s.name && !!s.exec
      const vScripts = scripts.filter(isValid)

      logger.info('%d valid server scripts loaded (%d total)',
        vScripts.length,
        scripts.length
      )

      vScripts
        .forEach((s: Script) => logger.debug('server script ready: %s', s.name))

      // All scripts (even invalid ones) are given to server scripts service
      // we might want to look at errors
      serverScriptsService.Update(scripts)
    })
}

/**
 * App entry point
 */
(async (): Promise<void> => {
  /**
     * Install dependencies & make initial server-script load
     */

  if (!config.scripts.dependencies.assumeInstalled) {
    await installDependencies()
  }

  return reloadServerScripts()
})().then(() => {
  /**
     * Setup dependency watcher that installs dependencies on
     * change & reloads server-scripts
     */

  return deps.Watcher(config.scripts.dependencies.packageJSON, async () => {
    await installDependencies()

    // Reload scripts every-time packages change!
    return reloadServerScripts()
  })
}).then(() => {
  /**
     * Setup server-script watcher that will reload server-side scripts
     */

  serverScripts.Watcher(config.scripts.server.basedir, reloadServerScripts)
})

gRPCServer.LoadDefinitions(path.join(config.protobuf.path, '/service-corredor.proto')).then((
  { corredor }
) => {
  const serviceDefinitions: gRPCServer.ServiceDefinition = new Map()
  serviceDefinitions.set(
    // @ts-ignore
    corredor.ServerScripts.service,
    serverScripts.Handlers(
      serverScriptsService,
      logger.child({ system: 'gRPC', service: 'ServerScripts' })
    )
  )

  serviceDefinitions.set(
    // @ts-ignore
    corredor.ClientScripts.service,
    clientScripts.Handlers(
      clientScriptsService,
      logger.child({ system: 'gRPC', service: 'ClientScripts' })
    )
  )

  logger.debug('starting gRPC server')
  gRPCServer.Start(config.server, logger, serviceDefinitions)
})

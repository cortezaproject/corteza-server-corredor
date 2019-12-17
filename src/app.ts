/* eslint-disable @typescript-eslint/ban-ts-ignore */

// @ts-ignore
import * as config from '+config'
import path from 'path'
import logger from '+logger'
import * as deps from './scripts/deps'
import * as serverScripts from '+ServerScripts'
import * as gRPCServer from '+grpc-server'

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

logger.debug('initializing server-scripts service')
const serverScriptsService = new serverScripts.Service(config.scripts.exec)

logger.info('server-scripts service configured')
logger.debug(
  'cServer system API baseUrl',
  config.scripts.exec.cServers.system.apiBaseURL)
logger.debug(
  'cServer compose API baseUrl',
  config.scripts.exec.cServers.compose.apiBaseURL)
logger.debug(
  'cServer messaging API baseUrl',
  config.scripts.exec.cServers.messaging.apiBaseURL)

async function installDependencies (): Promise<deps.PackageInstallStatus[]> {
  logger.info('installing dependencies from %s', config.scripts.dependencies.packageJSON)
  return deps.Install(
    config.scripts.dependencies.packageJSON,
    config.scripts.dependencies.nodeModules)
}

async function reloadServerScripts (): Promise<void> {
  // Reload scripts every-time packages change!
  logger.info('reloading server scripts')
  return serverScripts.Reloader(config.scripts.server.basedir)
    .then((scripts: serverScripts.Script[]) => {
      const isValid = (s: serverScripts.Script): boolean => !!s.fn && s.errors.length === 0

      logger.info('%d valid server scripts loaded (%d total)',
        scripts.filter(isValid).length,
        scripts.length
      )

      scripts
        .filter(isValid)
        .forEach((s: serverScripts.Script) => logger.debug('server script ready: %s', s.name))

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

gRPCServer.LoadDefinitions(path.join(config.protobuf.path, '/service-corredor-v2020.3.proto')).then((
  { corredor }
) => {
  const serviceDefinitions: gRPCServer.ServiceDefinition = new Map()
  serviceDefinitions.set(
    // @ts-ignore
    corredor.ServerScripts.service,
    serverScripts.Handlers(
      serverScriptsService,
      logger.child({ system: 'gRPC', service: 'server-scripts' })
    )
  )

  logger.debug('starting gRPC server')
  gRPCServer.Start(config.server, serviceDefinitions)
})

import * as deps from './scripts/deps'
import * as config from './config'
import logger from './logger'
import * as scriptLoader from './scripts/loader'
import { Script } from './scripts/types'
import * as clientScripts from './scripts/client'
import * as serverScripts from './scripts/server'
import watch from 'node-watch'
import { debounce } from 'lodash'

interface WatchFn {
    (): void;
}

const watcherOpts = {
  persistent: false,
  recursive: true,
  delay: 200,
  filter: /\.js$/,
}

interface WatcherConfig {
  basedir: string;
  enabled: boolean;
  watch: boolean;
}

export async function InstallDependencies (): Promise<deps.PackageInstallStatus[]> {
  if (!config.scripts.dependencies.autoUpdate) {
    return
  }

  logger.info('installing dependencies from %s', config.scripts.dependencies.packageJSON)
  return deps.Install(logger, config.scripts.dependencies)
}

export async function ReloadServerScripts (svc: serverScripts.Service): Promise<void> {
  if (!config.scripts.server.enabled) {
    return
  }

  // Reload scripts every-time packages changes!
  logger.info('reloading server scripts')
  return scriptLoader.Reloader(config.scripts.server.basedir)
    .then((scripts: Script[]) => {
      const isValid = (s: Script): boolean => !!s.name && !!s.exec
      const vScripts = scripts.filter(isValid)

      logger.info('%d valid server scripts loaded (%d total)',
        vScripts.length,
        scripts.length,
      )

      vScripts
        .forEach((s: Script) => logger.debug('server script ready: %s', s.name))

      // All scripts (even invalid ones) are given to server scripts service
      // we might want to look at errors
      svc.Update(scripts)
    })
}

export async function ReloadClientScripts (svc: clientScripts.Service): Promise<void> {
  // if (!config.scripts.client.enabled) {
  //   return
  // }

  // @todo implementation
  // logger.info('reloading client scripts')
  // return
}

export function Watcher (callback: WatchFn, cfg: WatcherConfig, opts = watcherOpts): void {
  if (!cfg.enabled || !cfg.watch) {
    return
  }

  const watcher = watch(cfg.basedir, opts, debounce(() => callback(), 500))
  process.on('SIGINT', watcher.close)
}

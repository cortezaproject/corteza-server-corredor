import * as deps from './scripts/deps'
import * as config from './config'
import logger from './logger'
import * as scriptLoader from './scripts/loader'
import { Script } from './scripts/shared'
import * as serverScripts from './scripts/server'
import * as clientScripts from './scripts/client'
import { BundleBuilder } from './bundler'
import watch from 'node-watch'
import { debounce } from 'lodash'
import fs from 'fs'
import path from 'path'

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

interface ParsedBundleFilename {
  bundle: string;
  filename: string;
  ext: string;
}

// parse /home/wrk/Projects/corteza/corteza-server-corredor/usr/src/client/auth/auth_clientscript.js into
// {
//   bundle: 'auth',
//   filename: 'auth_clientscript',
//   ext: 'js'
// }
export function ParseBundleScriptFilename (f: string): ParsedBundleFilename {
  const reg = new RegExp(/(\w+)(\/)(?!.*\/)(\w+)\.(.*)/)

  const p: ParsedBundleFilename = {
    bundle: '',
    filename: '',
    ext: '',
  }

  if (!reg.test(f)) {
    return p
  }

  const [, bundle, , filename, ext] = reg.exec(f)

  p.bundle = bundle
  p.filename = filename
  p.ext = ext

  return p
}

// parse /home/wrk/Projects/corteza/corteza-server-corredor/usr/dist/client/compose.bundle.js into
// {
//   bundle: 'compose',
//   filename: 'compose.bundle.js',
//   ext: 'js'
// }
export function ParseBundleFilename (f: string): ParsedBundleFilename {
  const reg = new RegExp(/(?!.*\/)(\w+)\.bundle\.(.*)/)

  const p: ParsedBundleFilename = {
    bundle: '',
    filename: '',
    ext: '',
  }

  if (!reg.test(f)) {
    return p
  }

  const [filename, bundle, ext] = reg.exec(f)

  p.bundle = bundle
  p.filename = filename
  p.ext = ext

  return p
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
      const isValid = (s: Script): boolean => !!s.name && !!s.exec && s.errors.length === 0
      const vScripts = scripts.filter(isValid)

      scripts
        .filter(s => !isValid(s))
        .forEach(({ filepath, name, errors }) => {
          errors.forEach(error => {
            logger.warn({ filepath, scriptName: name }, 'server script error: %s', error)
          })
        })

      vScripts
        .forEach(
          ({ name, triggers }) =>
            logger.debug({ scriptName: name, triggers: triggers.length }, 'server script ready'))

      // All scripts (even invalid ones) are given to server scripts service
      // we might want to look at errors
      svc.Update(scripts)

      logger.info('%d valid server scripts loaded (%d total)',
        vScripts.length,
        scripts.length,
      )
    })
}

export async function ReloadClientScripts (svc: clientScripts.Service): Promise<void> {
  if (!config.scripts.client.enabled) {
    return
  }

  logger.info('reloading client scripts')

  console.log(svc)

  const files: Map<string, string[]> = new Map<string, string[]>()

  for await (const r of scriptLoader.Finder(config.scripts.client.basedir)) {
    const parsed = ParseBundleScriptFilename(r.filepath)

    if (parsed.bundle !== '') {
      const v = files.get(parsed.bundle) || [] as Array<string>
      files.set(parsed.bundle, [r.filepath, ...v])
    }
  }

  if (!files.size) {
    return
  }

  // call bundlebuilder and packer? to create files
  const bb = new BundleBuilder()

  // files.forEach(async (filepaths, bundle) => {
  for await (const bundle of files.keys()) {
    const filepaths = files.get(bundle)
    bb.addBundle(bundle)

    for await (const f of filepaths) {
      const s = await scriptLoader.LoadScript({ filepath: f }, config.scripts.client.basedir)

      s.forEach(async (script) => {
        bb.registerScript2(script, f, bundle)
      })
    }
  }

  for await (const bundle of bb.getBundles()) {
    bb.setStream(fs.createWriteStream(path.resolve(config.scripts.client.bundleoutput, `${bundle}.exports.js`)))
    bb.generateImports(bundle)
    bb.dumpToStream(bundle)

    bb.buildWithBundler(
      bundle,
      path.resolve(config.scripts.client.bundleoutput, `${bundle}.exports.js`),
      path.resolve(config.scripts.client.bundleoutput),
    )
  }
}

export function Watcher (callback: WatchFn, cfg: WatcherConfig, opts = watcherOpts): void {
  if (!cfg.enabled || !cfg.watch) {
    return
  }

  const watcher = watch(cfg.basedir, opts, debounce(() => callback(), 500))
  process.on('SIGINT', watcher.close)
}

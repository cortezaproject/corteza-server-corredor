import webpack from 'webpack'
import { Script } from '../scripts/shared'
import fs from 'fs'

interface Entry {
  [bundle: string]: string;
}

interface BundledScripts {
  [bundle: string]: Script[];
}

/**
 * Converts bundle/scripts list into
 * @param bs
 * @constructor
 */
export function BootLoader (outputPath: string, bs: BundledScripts): Entry {
  const e: Entry = {}

  for (const bundle in bs) {
    if (!Object.prototype.hasOwnProperty.call(bs, bundle)) {
      continue
    }

    // Scripts
    const ss = bs[bundle]

    // Destination for boot loader & entry point for bundler (webpack)
    e[bundle] = `${outputPath}/.${bundle}.js`

    const entry = fs.createWriteStream(e[bundle])

    // Write serialized scripts
    entry.write('export const scripts = ')

    // Trim out all we do not need.
    entry.write(JSON.stringify((ss || [])
      // We need name, triggers & security, function(s) will be merged inside mapToScript
      .map(({ name, triggers, security }) => ({ name, triggers, security }))),
    )
    entry.write(';\n')

    // Find and merge scripts (in scripts array we have static data
    // with processed, expanded props like security, triggers etc.
    entry.write(`
function mapToScript(name, exportedScript) {
  const i = scripts.findIndex(s => s.name === name)
  if (i > -1) {
    scripts[i] = { ...exportedScript, ...scripts[i] } 
  }
}   
`)

    // Load each script and map it to the list
    ss.forEach((s: Script) => {
      entry.write(`mapToScript('${s.name}', require('${s.filepath}').${s.exportName});\n`)
    })

    // Script registration function
    // Iterates over all known scripts and registers it to eventbus & uiHooks.
    entry.write(`
export function Register({ verbose = true, eventbus = undefined, uiHooks = undefined } = {}) {
  if (scripts.length == 0) {
    if (verbose) console.debug('no scripts to register')
  }

  if (verbose) console.debug('registering bundled client scripts')
  
  if (uiHooks !== undefined) {
    if (verbose) console.debug('registering UI hooks')
    uiHooks.Register(...scripts.entries())
  }
  
  if (eventbus !== undefined) {
    if (verbose) console.debug('registering eventbus handlers')
    scripts
      .forEach(s => {
        (s.triggers || [])
          .forEach(t => {
            t.scriptName = s.name
            try {
              if (verbose) console.debug('registering script', s.name)
              eventbus.Register(ev => serverScriptHandler(api, ev, s.name), t)
            } catch (e) {
              console.error(e)
            }
          })
      })
  }
}
`)

    entry.close()
  }

  return e
}

/**
 * Bundles client scripts w/ webpack
 *
 * @param {string} name
 * @param {string} entry
 * @param {string} context
 * @param {string} outputPath
 *
 * @constructor
 */
export function Pack (name, entry, context, outputPath): void {
  const cfg: webpack.Configuration = {
    // mode: 'production',
    mode: 'development',
    target: 'web',
    entry,
    context,
    output: {
      filename: name + '.js',
      library: name + 'ClientScripts',
      libraryTarget: 'this',
      path: outputPath,
    },
  }

  webpack(cfg).run((err: Error) => {
    if (err) return console.error(err)
  })
}

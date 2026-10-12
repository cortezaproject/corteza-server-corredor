import webpack from 'webpack'
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin'
import fs from 'fs'
import { Logger } from 'pino'
import { Script } from '../types'

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
function BootLoader (outputPath: string, bs: BundledScripts): Entry {
  const e: Entry = {}

  for (const bundle in bs) {
    if (!Object.prototype.hasOwnProperty.call(bs, bundle)) {
      continue
    }

    // Scripts
    const ss = bs[bundle]

    // Destination for boot loader & entry point for bundler (webpack)
    e[bundle] = `${outputPath}/${bundle}.client-scripts.src.js`

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
    ss.forEach((s) => {
      entry.write(`mapToScript('${s.name}', require('${s.src}').default);\n`)
    })

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
 * @param {Logger} log
 *
 * @constructor
 */
function Pack (name: string, entry: string, context: string, outputPath: string, log: Logger): Promise<void> {
  const type = 'client-scripts'
  const cfg: webpack.Configuration = {
    // mode: 'production',
    mode: 'development',
    target: 'web',
    entry,
    context,
    output: {
      filename: `${name}.${type}.js`,
      library: name + 'ClientScripts',
      libraryTarget: 'this',
      path: outputPath,
    },
    // browser versions of the Node built-ins that webpack 4 bundled by itself
    plugins: [new NodePolyfillPlugin()],
    module: {
      rules: [
        // the polyfills resolve to package directories, which a strict ES module cannot import
        { test: /\.m?js$/, resolve: { fullySpecified: false } },
      ],
    },
  }

  return new Promise(resolve => {
    const compiler = webpack(cfg)

    compiler.run((err, stats) => {
      if (err) {
        log.error({ bundle: name, err }, 'could not bundle client scripts')
      } else if (stats?.hasErrors()) {
        // the bundle is still written, and throws when loaded
        stats.toJson({ all: false, errors: true }).errors?.forEach(e => {
          log.warn({ bundle: name, script: e.moduleName }, e.message)
        })
      }

      compiler.close(() => resolve())
    })
  })
}

export default {
  BootLoader,
  Pack,
}

import webpack from 'webpack'
import fs from 'fs'
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
 *
 * @constructor
 */
function Pack (name, entry, context, outputPath): void {
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
  }

  webpack(cfg).run((err: Error) => {
    if (err) return console.error(err)
  })
}

export default {
  BootLoader,
  Pack,
}

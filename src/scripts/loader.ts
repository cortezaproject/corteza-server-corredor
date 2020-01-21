import { Make as MakeTriggers, Trigger } from './trigger'
import { Script } from './shared'
import { promises as fs } from 'fs'
import path from 'path'
import logger from '../logger'

interface RawScript {
  filepath: string;
}

/**
 * Recursively gathers scripts-like files and returns generator
 *
 * @param {string} p path
 * @param {RegExp|undefined} validator
 */
export async function * Finder (p: string, validator: RegExp|undefined = /\.js$/): AsyncGenerator<RawScript> {
  const ee = await fs.readdir(p, { withFileTypes: true })
  for (const e of ee) {
    const filepath = path.resolve(p, e.name)
    if (e.isDirectory()) {
      yield * Finder(filepath, validator)
    } else if (validator.test(e.name)) {
      yield { filepath }
    }
  }
}

export function ResolveScript (name: string, filepath: string, def: {[_: string]: unknown}): Script {
  let triggers: Trigger[] = []
  const errors: string[] = []

  if (typeof def !== 'object') {
    return { name, filepath, errors: ['expecting an object with script definition (exec, triggers)'] }
  }

  if (Object.prototype.hasOwnProperty.call(def, 'triggers')) {
    triggers = MakeTriggers(def.triggers) ?? []
  }

  if (!triggers || triggers.length === 0) {
    errors.push('invalid or undefined triggers')
  }

  if (!Object.prototype.hasOwnProperty.call(def, 'exec')) {
    errors.push('exec callback missing')
  } else if (typeof def.exec !== 'function') {
    errors.push('exec not a function')
  }

  // Merge resolved & the rest
  return { ...(def as object), filepath, name, errors, triggers }
}

/**
 * Populates & returns script object
 *
 * @param {string} filepath
 * @param {string} basepath
 */
export async function LoadScript ({ filepath }: RawScript, basepath: string): Promise<Script[]> {
  let filename = filepath.substring(basepath.length + 1)
  const ss: Script[] = []

  const lastDot = filename.lastIndexOf('.')
  if (lastDot > -1) {
    filename = filename.substring(0, lastDot)
  }

  const script = {
    filepath,
    name: filename,
    errors: [],
  }

  return import(filepath).then(exports => {
    for (const name in exports) {
      if (!Object.prototype.hasOwnProperty.call(exports, name)) {
        continue
      }

      if (typeof exports[name] !== 'object') {
        continue
      }

      let scriptName = filename
      if (name !== 'default') {
        scriptName = `${filename}:${name}`
      }

      ss.push(ResolveScript(scriptName, filepath, (exports[name] as {[_: string]: unknown})))
    }

    return ss
  }).catch(e => {
    logger.error(e)
    return [{
      ...script,
      errors: [e.toString()],
    }]
  })

}

export async function Reloader (basedir: string): Promise<Script[]> {
  const pp: Script[] = []

  for await (const r of Finder(basedir)) {
    pp.push(...(await LoadScript(r, basedir)))
  }

  return pp
}

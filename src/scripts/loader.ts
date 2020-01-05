import { Make as MakeTriggers, Trigger } from './trigger'
import { Script, FluentTrigger } from './types'
import { promises as fs } from 'fs'
import path from 'path'

interface TriggerFn {
  (t: FluentTrigger): Trigger[];
}

interface ScriptDefinition {
  triggers: Trigger[] | TriggerFn;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
// export const ScriptExtValidator = /\.js$/

/**
 * Recursively gathers scripts-like files and returns generator
 *
 * @param {string} p path
 * @param {RegExp|undefined} validator
 */
export async function * Finder (p: string, validator: RegExp|undefined = /\.js$/): AsyncGenerator<string> {
  const ee = await fs.readdir(p, { withFileTypes: true })
  for (const e of ee) {
    const fp = path.resolve(p, e.name)
    if (e.isDirectory()) {
      yield * Finder(fp, validator)
    } else if (validator.test(e.name)) {
      yield fp
    }
  }
}

export function ResolveScript (name: string, def: {[_: string]: unknown}): Script {
  let triggers: Trigger[] = []
  const errors: string[] = []

  if (typeof def !== 'object') {
    return { name, errors: ['triggers property/callback missing'] }
  }

  if (Object.prototype.hasOwnProperty.call(def, 'triggers')) {
    triggers = MakeTriggers(def.triggers) ?? []
  }

  if (!triggers || triggers.length === 0) {
    errors.push('invalid or undefined triggers')
  }

  // @todo make sure exec is there...
  if (!Object.prototype.hasOwnProperty.call(def, 'exec')) {
    errors.push('exec callback missing')
  } else if (typeof def.exec !== 'function') {
    errors.push('exec not a function')
  }

  // Merge resolved & the rest
  return { ...(def as object), name, errors, triggers }
}

/**
 * Populates & returns script object
 *
 * @param {string} filepath
 * @param {string} basepath
 */
export function LoadScript (filepath: string, basepath: string): Script[] {
  const ss: Script[] = []
  const filename = filepath.substring(basepath.length + 1)
  let module: {[_: string]: unknown}

  try {
    // We'll use require instead of import
    // because we need more control over cache (invalidation)

    // Remove from cache & (re)require the script
    delete require.cache[require.resolve(filepath)]

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    module = require(filepath)
  } catch (e) {
    return [{
      name: filename,
      errors: [e.toString()]
    }]
  }

  for (const name in module) {
    if (!Object.prototype.hasOwnProperty.call(module, name)) {
      continue
    }

    if (typeof module[name] !== 'object') {
      continue
    }

    ss.push(ResolveScript(
      name === 'default' ? filename : name,
      (module[name] as {[_: string]: unknown})))
  }

  return ss
}

export async function Reloader (dir: string): Promise<Script[]> {
  const pp: Script[] = []

  for await (const scriptLocation of Finder(dir)) {
    pp.push(...LoadScript(scriptLocation, dir))
  }

  return pp
}

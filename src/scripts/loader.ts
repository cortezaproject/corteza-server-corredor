import { Make as MakeTriggers } from './trigger'
import { Script, ScriptFn, ScriptSecurity } from './shared'
import { promises as fs } from 'fs'
import path from 'path'
import logger from '../logger'

interface RawScript {
  filepath: string;
}

interface RawScriptSecurity {
  runAs?: string;
  allow: string|string[];
  deny: string|string[];
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

function resolveSecurity ({ allow, deny, runAs }: RawScriptSecurity): ScriptSecurity|null {
  if (!allow && !deny && !runAs) {
    return null
  }

  const out: ScriptSecurity = { runAs, allow: [], deny: [] }

  if (allow) {
    out.allow = Array.isArray(allow) ? allow : [allow]
  }

  if (deny) {
    out.deny = Array.isArray(deny) ? deny : [deny]
  }

  return out
}

/**
 * Resolves & expands given script definition, creates triggers
 *
 * @todo make this more typescript-ish
 * @todo accept class as script def
 *
 * @param name
 * @param filepath
 * @param def
 * @constructor
 */
export function ProcExports (s: Script, def: {[_: string]: unknown}): Script {
  s = {
    errors: [],
    ...s,
  }

  if (Object.prototype.hasOwnProperty.call(def, 'label') && typeof def.label === 'string') {
    s.label = def.label
  }

  if (Object.prototype.hasOwnProperty.call(def, 'description') && typeof def.description === 'string') {
    s.description = def.description
  }

  if (Object.prototype.hasOwnProperty.call(def, 'triggers')) {
    s.triggers = MakeTriggers(def.triggers) ?? []
  }

  if (!s.triggers || s.triggers.length === 0) {
    s.errors.push('invalid or undefined triggers')
  }

  if (!Object.prototype.hasOwnProperty.call(def, 'exec')) {
    s.errors.push('exec callback missing')
  } else if (typeof def.exec !== 'function') {
    s.errors.push('exec not a function')
  } else {
    s.exec = def.exec as ScriptFn
  }

  if (Object.prototype.hasOwnProperty.call(def, 'security')) {
    if (typeof def.security === 'object') {
      s.security = resolveSecurity(def.security as RawScriptSecurity)
    }
  }

  // Merge resolved & the rest
  return s
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

  const baseScript = {
    filepath,
    name: filename,
    errors: [],
    updatedAt: new Date(),
  }

  let exports: {[_: string]: {[_: string]: unknown}}

  try {
    // We'll use require instead of import
    // because we need more control over cache (invalidation)

    // Remove from cache & (re)require the script
    delete require.cache[require.resolve(filepath)]

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    exports = require(filepath)

    baseScript.updatedAt = (await fs.stat(filepath)).mtime
  } catch (e) {
    logger.error(e)
    return [{
      ...baseScript,
      errors: [e.toString()],
    }]
  }

  Object.freeze(baseScript)

  for (const name in exports) {
    const script = { ...baseScript }

    if (!Object.prototype.hasOwnProperty.call(exports, name)) {
      continue
    }

    if (typeof exports[name] !== 'object') {
      script.errors.push('expecting an object with script definition (exec, triggers)')
      continue
    }

    if (name !== 'default') {
      script.name = `${filename}:${name}`
    }

    ss.push(ProcExports(script, exports[name]))
  }

  return ss
}

export async function Reloader (basedir: string): Promise<Script[]> {
  const pp: Script[] = []

  for await (const r of Finder(basedir)) {
    pp.push(...(await LoadScript(r, basedir)))
  }

  return pp
}

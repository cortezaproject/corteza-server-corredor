import { Make as MakeTriggers } from './trigger'
import { Script, ScriptFn, ScriptSecurity } from './shared'
import { promises as fs } from 'fs'
import path from 'path'
import logger from '../logger'

export const ClientScriptFilenameMatcher = /^(?<name>(?<bundle>.+)\/.+)\.js$/
export const ServerScriptFilenameMatcher = /^(?<name>.+)\.js$/

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
export async function * Finder (p: string, validator: RegExp): AsyncGenerator<RawScript> {
  const ee = await fs.readdir(p, { withFileTypes: true })
  for (const e of ee) {
    const filepath = path.resolve(p, e.name)
    if (e.isDirectory()) {
      yield * Finder(filepath, validator)
    } else if (validator.test(path.join(p, e.name))) {
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
 * @param {string} filepath[0
 * @param {string} basepath
 */
export async function LoadScript ({ filepath }: RawScript, basepath: string, pathPattern: RegExp): Promise<Script[]> {
  const ss: Script[] = []

  // See ClientScriptFilenameMatcher and  ServerScriptFilenameMatcher
  //
  // These 2 regex matchers help us trim the extension and extract
  // additional info (bundle)
  const { groups } = pathPattern.exec(filepath.substring(basepath.length + 1))

  const baseScript = {
    filepath,

    // Placeholders, will be (some of them) overwritten by
    // ...groups
    name: filepath,
    bundle: undefined,

    // Expand what we extracted from the path & filename
    ...groups,

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

  for (const exportName in exports) {
    const script: Script = { ...baseScript, exportName }

    if (!Object.prototype.hasOwnProperty.call(exports, exportName)) {
      continue
    }

    if (typeof exports[exportName] !== 'object') {
      script.errors.push('expecting an object with script definition (exec, triggers)')
      continue
    }

    if (exportName !== 'default') {
      script.name = `${script.name || script.filepath}:${exportName}`
    }

    ss.push(ProcExports(script, exports[exportName]))
  }

  return ss
}

async function reloader (basedir: string, pathPatten: RegExp): Promise<Script[]> {
  const pp: Script[] = []

  for await (const r of Finder(basedir, pathPatten)) {
    pp.push(...(await LoadScript(r, basedir, pathPatten)))
  }

  return pp
}

export async function ClientScriptReloader (basedir: string): Promise<Script[]> {
  return reloader(basedir, ClientScriptFilenameMatcher)
}

export async function ServerScriptReloader (basedir: string): Promise<Script[]> {
  return reloader(basedir, ServerScriptFilenameMatcher)
}

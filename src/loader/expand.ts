import { Make as MakeTriggers } from '../scripts/trigger'
import { Script, ScriptFn, ScriptSecurity } from '../types'
import { File } from './types'

interface RawScriptSecurity {
  runAs?: string;
  allow: string|string[];
  deny: string|string[];
}

const excludedExports = [
  '__esModule',
]

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
 */
export function ProcExports (s: Script, def: {[_: string]: unknown}): Script {
  s = { errors: [], ...s }

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
 * Load (via require) src from File and generate set of Script objects (one for each valid export)
 *
 * It captures possible errors and
 */
export default function Expand ({ src, ref, updatedAt }: File): Script[] {
  try {
    // We'll use require instead of import
    // because we need more control over cache (invalidation)

    // Remove from cache & (re)require the script
    delete require.cache[require.resolve(src)]

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    exports = require(src)
  } catch (e) {
    return [{
      src,
      updatedAt,
      name: ref,
      errors: [e.toString()],
    } as Script]
  }

  return Object
    .getOwnPropertyNames(exports)
    .filter((e) => !excludedExports.includes(e))
    .map(exportName => {
      const script: Script = {
        src,
        updatedAt,
        exportName,
        name: `${ref}:${exportName}`,
        errors: [],
      }

      if (typeof exports[exportName] !== 'object') {
        script.errors.push('expecting an object with script definition (exec, triggers)')
        return script
      }

      return ProcExports(script, exports[exportName])
    })
}

/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { promises as fs } from 'fs'

import { Script, ScriptSecurity } from '.'
import { Parse } from 'scripts/docblock'

/**
 * Populates & returns script object
 *
 * @param {string} filepath
 * @param {string} basepath
 */
export async function MakeScript (filepath: string, basepath: string): Promise<Script> {
  return fs.readFile(filepath).then(source => {
    // Trim off leading path
    // @todo we trim too much of leading path
    const name = filepath.substring(basepath.length + 1)

    const rval: Script = {
      name,
      label: name,
      events: [],
      security: ScriptSecurity.invoker,
      errors: []
    }

    try {
      // We'll use require instead of import
      // because we need more control over cache (invalidation)

      // Remove from cache & (re)require the script
      delete require.cache[require.resolve(filepath)]

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require(filepath)

      if (!module.default) {
        rval.errors.push('default export not found')
        return rval
      }

      if (typeof module.default !== 'function') {
        rval.errors.push('exported default must be of type function')
        return rval
      }

      rval.fn = module.default
    } catch (e) {
      rval.errors.push(e.toString())
    }

    try {
      const doc = Parse(source.toString())

      if (doc.label !== undefined) {
        rval.label = doc.label
      }

      rval.description = doc.description
      rval.events = doc.events

      if (doc.security !== undefined) {
        rval.security = doc.security === ScriptSecurity.invoker ? ScriptSecurity.invoker : ScriptSecurity.definer
      }
    } catch (e) {
      rval.errors.push(e.toString())
    }

    return rval
  })
}

export async function Maker (gen: AsyncGenerator<string>, basepath: string): Promise<Script[]> {
  const pp: Promise<Script>[] = []

  for await (const scriptLocation of gen) {
    pp.push(MakeScript(scriptLocation, basepath))
  }

  return Promise.all(pp)
}

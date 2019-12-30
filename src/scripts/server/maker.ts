/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { promises as fs } from 'fs'
import { Script, ScriptFn } from '.'

/**
 * Populates & returns script object
 *
 * @param {string} filepath
 * @param {string} basepath
 */
export async function MakeScripts (filepath: string, basepath: string): Promise<Script[]> {
  return fs.readFile(filepath).then((source): Script[] => {
    // Trim off leading path
    // @todo we trim too much of leading path

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
      console.error(e)
      return [{
        name: filename,
        errors: [e.toString()]
      }]
    }

    for (const name in module) {
      if (!Object.prototype.hasOwnProperty.call(module, name)) {
        continue
      }

      let script: Script = {
        // Make sure we can find our default exports
        name: name === 'default' ? filename : name
      }

      if (typeof module[name] === 'object') {
        script = { ...script, ...(module[name] as Script) }
      }

      ss.push(script)
    }

    return ss
  })
}

export async function Maker (gen: AsyncGenerator<string>, basepath: string): Promise<Script[]> {
  const pp: Promise<Script[]>[] = []

  for await (const scriptLocation of gen) {
    pp.push(MakeScripts(scriptLocation, basepath))
  }

  return Promise.all(pp).then(
    // @ts-ignore
    set => set.flat()
  )
}

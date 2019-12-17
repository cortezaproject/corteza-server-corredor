import { ScriptExtValidator } from '.'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Recursively gathers scripts-like files and returns generator
 *
 * @param {string} p path
 * @param {RegExp|undefined} validator
 */
export async function * Finder (p: string, validator: RegExp|undefined = ScriptExtValidator): AsyncGenerator<string> {
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

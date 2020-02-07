import fs from 'fs'
import path from 'path'
import glob from 'glob'
import Expand from './expand'
import { Script } from '../scripts/shared'
import { File, FileType } from './types'

/**
 * Utility function for flatting w/ Array.reduce
 */
const flatten = (r, p): string => r.concat(p)

export default class Loader {
  readonly searchPaths: string[]
  readonly required: string
  readonly pattern: string
  readonly exclude: RegExp

  /**
   * @param searchPaths - list of paths to search for scripts
   * @param req - valid search-path MUST have this subdir
   * @param pattern - directory structure and filename pattern
   * @param exclude - filenames to skip
   */
  constructor (searchPaths: string[], req: FileType, pattern: string, exclude = /\/.+(\.test)\.(js|ts)$/) {
    this.searchPaths = searchPaths
    this.required = req
    this.pattern = pattern
    this.exclude = exclude
  }

  basePaths (): string[] {
    return this.searchPaths
      // run all paths through glob
      .map(sp => glob.sync(path.join(sp, this.required)))

      // flatten glob results (expanding search paths) of each search path
      .reduce(flatten, [])
  }

  /**
   * Finds files that match the pattern on all search paths
   *
   * This complex chain of map/reduce/filter/glob helps
   * collect all extensions scripts and
   */
  files (): Array<File> {
    // Using map to remove duplicates by overriding
    // existing entries with scripts from the later search-paths
    const uniq = new Map<string, File>()

    this.basePaths()
      .map(base =>
        glob
          // glob over base + pattern strings
          .sync(path.join(base, this.pattern))

          // exclude out all files we do not want (eg: tests)
          .filter(filepath => !this.exclude.test(filepath))

          // and prepare the final output (ScriptFile
          .map(src => ({
            src,

            // filename w/o search-path prefix
            // we're using this to remove duplicates and for script identification
            ref:
              src.substring(base.length - this.required.length),

            updatedAt:
              fs.statSync(src).mtime,
          })))

      // again, flatten results of the glob (valid script files) on each search path
      .reduce(flatten, [])
      .forEach(sf => uniq.set(sf.ref, sf))

    // Return simple array of ScriptFile
    return [...uniq.values()]
  }

  scripts (): Array<Script> {
    return this.files().map(Expand).reduce(flatten, [])
  }
}

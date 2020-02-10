import { BaseLogger } from 'pino'
import watch from 'node-watch'
import glob from 'glob'
import path from 'path'
import { spawnSync } from 'child_process'

interface CtorArgs {
  logger: BaseLogger;
  searchPaths: string[];
}

interface WatchCallback {
  (path: string): void;
}

/**
 * Utility function for flatting w/ Array.reduce
 */
const flatten = (r, p): string => r.concat(p)

export default class Dependencies {
  protected searchPaths: string[] = [];
  protected readonly log: BaseLogger;

  constructor ({ logger, searchPaths }: CtorArgs) {
    this.searchPaths = searchPaths
    this.log = logger.child({ name: 'services.dependencies' })
    this.log.debug('initializing')
  }

  /**
   * Find all package.json files under all search paths
   */
  getPackageJsonFiles (): string[] {
    const opt = {
      // Ignore node_modules
      ignore: '**/node_modules/**',

      // Only interested in files
      nodir: true,
    }

    return this.searchPaths
      // run all paths through glob
      .map(sp => glob.sync(path.join(sp, '**', 'package.json'), opt))

      // flatten glob results (expanding search paths) of each search path
      .reduce(flatten, [])
  }

  /**
   * Installs packages
   *
   * @todo check what happens with require cache after new yarn install
   *       it might be a problem
   *
   * @param pkgJsonPath - path to package.json
   */
  install (pkgJsonPath: string): void {
    const args = [
      'install',
      '--json',
      '--force',
      '--silent',
      '--emoji', 'off',
      '--no-progress',
    ]

    const opts = {
      cwd: path.dirname(pkgJsonPath),
    }

    const log = this.log.child({ path: pkgJsonPath })
    const yarn = spawnSync('yarn', args, opts)
    const stderr = yarn.stderr.toString()
    const stdout = yarn.stdout.toString()
    const nmdir = path.join(path.dirname(pkgJsonPath), 'node_modules')

    if (stderr.length > 0) {
      log.error('err' + stderr)
    } else if (stdout.length > 0) {
      stdout
        .split('\n')
        .filter(line => line.length > 0)
        .map(line => JSON.parse(line))
        .filter(({ type }) => type === 'step')
        .forEach(({ data }) => log.debug(data.message))
    }

    // Purge require cache -- remove all files that are in the
    //
    Object
      .getOwnPropertyNames(require.cache)
      .filter(path => path.substr(0, nmdir.length) === nmdir)
      .forEach((filename) => {
        delete require.cache[filename]
      })
  }

  /**
   * Watches all loaded package.json files
   *
   * Function installs dependencies on change and resolves
   *
   * @return path to changed file
   */
  watch (callback: WatchCallback): void {
    this.log.info('initializing watcher')
    process.on('SIGINT', watch(
      this.getPackageJsonFiles(),
      {
        persistent: false,
        recursive: false,
        delay: 1000,
        filter: /\/package\.json$/,
      },
      (eventType, filename) => {
        switch (eventType) {
          case 'update':
            delete require.cache[require.resolve(filename)]
            this.install(filename)
            callback(filename)
            break
        }
      },
    ).close)
  }
}

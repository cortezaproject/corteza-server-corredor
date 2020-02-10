import MakeFilterFn from './shared/filter'
import { corredor as exec } from '@cortezaproject/corteza-js'
import { BaseLogger } from 'pino'
import watch from 'node-watch'
import { debounce } from 'lodash'
import { Script } from '../types'
import GetLastUpdated from './shared/get-last-updated'
import Loader from '../loader'

interface ListFilter {
    query?: string;
    resourceType?: string;
    eventTypes?: string[];
}

interface CtorArgs {
  logger: BaseLogger;
  config: exec.Config;
  loader?: Loader;
}

/**
 *
 */
export default class ServerScripts {
  protected scripts: Script[] = [];
  protected readonly config: exec.Config;
  protected readonly log: BaseLogger;
  protected readonly loader?: Loader;

  /**
   * Service constructor
   */
  constructor ({ logger, config, loader }: CtorArgs) {
    this.config = config
    this.loader = loader
    this.log = logger.child({ name: 'services.server-scripts' })
    this.log.debug('initializing')
  }

  // Returns date of the most recently updated script from the set
  get lastUpdated (): Date {
    return GetLastUpdated(this.scripts)
  }

  /**
   * Loads scripts
   */
  update (set: Script[]): void {
    // Scripts loaded, replace set
    this.scripts = set
  }

  /**
   * Finds and executes the script using current configuration, passed arguments and logger
   *
   * @param name Name of the script
   * @param args Arguments for the script
   * @param log Exec logger to capture and proxy all log.* and console.* calls
   */
  async exec (name: string, args: exec.BaseArgs, log: BaseLogger): Promise<object> {
    const script: Script|undefined = this.scripts.find((s) => s.name === name)

    if (script === undefined) {
      return Promise.reject(new Error('script not found'))
    }

    if (script.errors && script.errors.length > 0) {
      return Promise.reject(new Error('can not run script with initialization errors'))
    }

    if (!script.exec || !(script.exec as exec.ScriptExecFn)) {
      return Promise.reject(new Error('can not run uninitialized script'))
    }

    if (script.exec as exec.ScriptExecFn) {
      return exec.Exec(script.exec as exec.ScriptExecFn, args, log, this.config)
    }
  }

  /**
   * Returns list of scripts
   */
  list (f: ListFilter = {}): Script[] {
    return this.scripts.filter(MakeFilterFn(f))
  }

  /**
   * Processes server scripts from loader
   *
   * Function calls script loader and loads all available server scripts
   * It logs (warn) all errors on all scripts and (debug) valid scripts
   *
   * Server scripts service is then updated with the new list of scripts.
   */
  process (): void {
    if (!this.loader) {
      this.log.debug('no loader: processing disabled')
    }

    this.log.info({ searchPaths: this.loader.searchPaths }, 'reloading server scripts')

    const scripts = this.loader.scripts()
    const isValid = (s: Script): boolean => s && !!s.name && !!s.exec && s.errors.length === 0
    const vScripts = scripts.filter(isValid)

    // Log errors on all invalid scripts
    scripts
      .filter(s => !isValid(s))
      .forEach(({ src, errors }) => {
        errors.forEach(error => {
          this.log.warn({ src }, 'script error: %s', error)
        })
      })

    // Let developer know about valid scripts loaded
    vScripts
      .forEach(({ src }) => this.log.debug({ src }, 'script ready'))

    // All scripts (even invalid ones) are given to server scripts service
    // we might want to look at errors
    this.update(scripts)

    // Summarize reloading stats
    this.log.info({ valid: vScripts.length, total: scripts.length }, 'processed')
  }

  watch (): void {
    this.log.info('initializing watcher')
    process.on('SIGINT', watch(
      this.loader.basePaths(),
      {
        persistent: false,
        recursive: true,
        delay: 200,
        filter: /\.js$/,
      },
      debounce(() => {
        this.log.debug('change detected')
        this.process()
      }, 500),
    ).close)
  }
}

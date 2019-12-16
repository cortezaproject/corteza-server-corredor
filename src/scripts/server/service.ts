import { Logger } from './logger'
import { Script, ExecResponse, ScriptSecurity, ExecConfig, ExecArgsRaw } from './d'
import { ExecArgs } from './exec-args'
import { ExecContext } from './exec-context'

export interface ListFilter {
    query?: string;
    resource?: string;
    events?: string[];
    security?: ScriptSecurity;
}

export interface ListFiterFn {
    (item: Script): boolean;
}

function match (f: ListFilter): ListFiterFn {
  return (item: Script): boolean => {
    if (f === undefined) {
      // Match all when no filter
      return true
    }

    if (!!f.resource && f.resource !== item.resource) {
      // Filter by resource, expecting exact match
      return false
    }

    if (!!f.events && f.events.length > 0) {
      // item has less events than filter,
      // no way this can be a match.
      if (item.events.length < f.events.length) {
        return false
      }

      // Filter by events, should contain all filtered events
      for (const e of f.events) {
        if (!item.events.includes(e)) {
          return false
        }
      }
    }

    if (!!f.security && f.security !== item.security) {
      return false
    }

    if (f.query) {
      // Strings to search through
      const str = `${item.name} ${item.label} ${item.description} ${item.resource} ${item.events.join(' ')}`

      // search query terms
      for (const t of f.query.split(' ')) {
        if (str.indexOf(t) > -1) {
          return true
        }
      }

      // none matched, fail
      return false
    }

    // No match
    return true
  }
}

/**
 *
 */
export class Service {
    private scripts: Script[] = [];
    private readonly config: ExecConfig;

    /**
     * Service constructor
     */
    constructor (config: ExecConfig) {
      this.config = config
    }

    /**
     * Loads scripts
     *
     * @return {void}
     */
    Update (set: Script[]): void {
      // Scripts loaded, replace set
      this.scripts = set
    }

    /**
     * Executes the script
     *
     * @param name
     * @param args
     * @returns ExecResponse
     */
    async Exec (name: string, args: ExecArgsRaw): Promise<ExecResponse> {
      const script: Script|undefined = this.scripts.find((s) => s.name === name)

      if (script === undefined) {
        throw new Error('script not found')
      }

      if (!script.fn) {
        throw new Error('can not run uninitialized script')
      }

      if (script.errors.length > 0) {
        throw new Error('can not run script with initialization errors')
      }

      // global console replacement,
      // will allow us to catch console.* calls and return them to the caller
      const log = new Logger()

      // Cast some of the common argument types
      // from plain javascript object to proper classes
      const execArgs = new ExecArgs(args)

      // Exec function Context
      const execCtx = new ExecContext({
        config: this.config,
        args: execArgs,
        log
      })

      try {
        // Wrap fn() with Promise.resolve - we do not know if function is async or not.
        return Promise.resolve(script.fn(execArgs, execCtx)).then((rval: unknown) => {
          let result = {}

          if (rval === 'object' && rval.constructor.name === 'Object') {
            // Expand returned values into result if function returned a plain javascript object
            result = Object.assign({}, rval)
          } else {
            // If anything else was returned, stack it under 'result' property
            result = { result: rval }
          }

          // Wrap returning value
          return {
            // The actual result
            result,

            // Captured log from the execution
            log: log.getBuffer()
          }
        })
      } catch (e) {
        return Promise.reject(e)
      }
    }

    /**
     * Returns list of scripts
     */
    List (f: ListFilter = {}): Script[] {
      return this.scripts.filter(match(f))
    }
}

/* eslint-disable @typescript-eslint/ban-ts-ignore */

import { Logger, Script, ExecResponse, ExecConfig, ExecArgs, ExecArgsRaw, ExecContext } from '.'

export interface ListFilter {
    query?: string;
    resource?: string;
    events?: string[];
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

    if (f.resource || f.events) {
      const tt = item.triggers.filter(({ resources, events }) => {
        if (f.resource && f.resource.length > 0) {
          // Filter by resource
          if (!resources || resources.indexOf(f.resource) === -1) {
            // No resources found on trigger
            return false
          }
        }

        if (f.events && f.events.length > 0) {
          // Filter by events
          if (!events || f.events.find(fe => (events.indexOf(fe) > -1)) === undefined) {
            return false
          }
        }

        return true
      })

      if (tt.length === 0) {
        // Filtering by resource and/or events but
        // none of the triggers matched
        return false
      }
    }

    if (f.query) {
      // Strings to search through
      const str = `${item.name} ${item.label} ${item.description}`

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
        // @ts-ignore
        args: execArgs,
        log
      })

      try {
        // Wrap fn() with Promise.resolve - we do not know if function is async or not.
        return Promise.resolve(script.fn(execArgs, execCtx)).then((rval: unknown): ExecResponse => {
          let result = {}

          if (rval === false) {
            // Abort when returning false!
            throw new Error('Aborted')
          }

          if (typeof rval === 'object' && rval && rval.constructor.name === 'Object') {
            // Expand returned values into result if function returned a plain javascript object
            result = { ...rval }
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

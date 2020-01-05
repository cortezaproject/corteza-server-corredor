/* eslint-disable @typescript-eslint/ban-ts-ignore */

import MakeFilterFn from '../filter'
import * as exec from '../exec'

interface ListFilter {
    query?: string;
    resource?: string;
    events?: string[];
}

interface Script {
  name: string;
  // triggers: unknown[];
  errors: string[];
  exec: unknown;
}

/**
 *
 */
export class Service {
    private scripts: Script[] = [];
    private readonly config: exec.Config;

    /**
     * Service constructor
     */
    constructor (config: exec.Config) {
      this.config = config
    }

    /**
     * Loads scripts
     *
     * @return {void}
     */
    Update (set): void {
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
    async Exec (name: string, args: exec.ArgsRaw): Promise<exec.Response> {
      const script: Script|undefined = this.scripts.find((s) => s.name === name)

      if (script === undefined) {
        throw new Error('script not found')
      }

      if (script.errors && script.errors.length > 0) {
        throw new Error('can not run script with initialization errors')
      }

      if (!script.exec || !(script.exec as exec.ScriptExecFn)) {
        throw new Error('can not run uninitialized script')
      }

      if (script.exec as exec.ScriptExecFn) {
        return exec.Exec(script as exec.ExecutableScript, args, this.config)
      }
    }

    /**
     * Returns list of scripts
     */
    List (f: ListFilter = {}): Script[] {
      return this.scripts.filter(MakeFilterFn(f))
    }
}

import { BaseLogger } from 'pino'
import { Args, BaseArgs } from './args'
import { Ctx } from './ctx'

export interface ArgsRaw {
    jwt?: string;
    [_: string]: unknown;
}

export interface ScriptExecFn {
    (args: BaseArgs, ctx?: Ctx): unknown;
}

/**
 * Script executor, prepares arguments, context and pass both to the script's exec function
 * @param {function} exec Function to be executed
 * @param {BaseArgs} args Raw arguments for the script
 * @param {BaseLogger} log Exec logger to capture and proxy all log.* and console.* calls
 * @param config Configuration for context that we feed to the script
 * @returns Promise<object>
 */
export async function Exec (exec: ScriptExecFn, args: BaseArgs, log: BaseLogger, config?: unknown): Promise<object> {
  // Context for exec function (script)
  const execCtx = new Ctx(config, log, args)

  try {
    // Wrap exec() with Promise.resolve - we do not know if function is async or not.
    return Promise.resolve(exec(args, execCtx)).then((rval: unknown): object => {
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
      return result
    })
  } catch (e) {
    return Promise.reject(e)
  }
}

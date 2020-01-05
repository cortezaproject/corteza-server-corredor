import { LogToArray } from '../log-to-array'
import pino from 'pino'
import { Args } from './args'
import { Config, Ctx } from './ctx'
import { cortezaTypes } from './args-corteza'

export interface ArgsRaw {
    jwt?: string;
    [_: string]: unknown;
}

export interface Response {
    result: object;
    log: string[];
}

export interface ScriptExecFn {
    (args: Args, ctx?: Ctx): unknown;
}

export interface ExecutableScript {
  exec: ScriptExecFn;
}

/**
 * Script executor, prepares arguments, context and pass both to the script's exec function
 */
export async function Exec (script: ExecutableScript, rawArgs: ArgsRaw, config?: Config): Promise<Response> {
  // global console replacement,
  // will allow us to catch console.* calls and return them to the caller
  const logBuffer = new LogToArray()
  const log = pino({}, logBuffer)

  // Cast some of the common argument types
  // from plain javascript object to proper classes
  const args = new Args(rawArgs, cortezaTypes)

  // Exec function Context
  const execCtx = new Ctx(config, log, args)

  try {
    // Wrap exec() with Promise.resolve - we do not know if function is async or not.
    return Promise.resolve(script.exec(args, execCtx)).then((rval: unknown): Response => {
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
        log: logBuffer.serialize()
      }
    })
  } catch (e) {
    return Promise.reject(e)
  }
}

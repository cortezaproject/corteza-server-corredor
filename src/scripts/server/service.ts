import {Logger} from "./logger";
import {IScript, IExecContext, IExecResponse} from "./d";
import {ExecArgs} from "./exec-args";



/**
 * Creates script-name-comparison function
 * @param name
 */
function eqName (name : string) {
    name = name.toLowerCase()
    return (s:IScript) => s.name.toLowerCase() === name
}

/**
 *
 */
export class Service {
    private scripts: IScript[] = [];

    /**
     * Service constructor
     */
    constructor () {}

    /**
     * Loads scripts
     *
     * @return {void}
     */
    async Update (set : IScript[]) {
        // Scripts loaded, replace set
        this.scripts = set
    }

    /**
     * Executes the script
     *
     * @param name
     * @param args
     */
    Exec (name: string, args: object): IExecResponse {
        const script : IScript|undefined = this.scripts.find(eqName(name));

        if (script === undefined) {
            throw new Error('script not found')
        }

        if (!script.fn) {
            throw new Error('can not run uninitialized script')
        }

        // Prepare context
        let ctx : IExecContext = {
            // global console replacement,
            // will allow us to catch console.* calls and return them to the caller
            log: new Logger()
        };

        const rval = script.fn(
            // Cast some of the common argument types
            // from plain javascript object to proper classes
            new ExecArgs(args),
            ctx
        );

        let result = {};
        if (typeof rval === 'object' && rval.constructor.name === 'Object') {
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
            log: ctx.log.getBuffer(),
        }
    }

    /**
     * Returns list of scripts
     */
    List () : IScript[] {
        return this.scripts
    }
}

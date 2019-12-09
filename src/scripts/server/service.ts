import {GetScripts} from "./scripts";
import ScriptLogger from "./logger";
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
export default class Service {
    readonly path: string;
    private scripts: IScript[];

    /**
     *
     * @param path
     */
    constructor (path: string) {
        this.path = path
        this.scripts = []
    }

    /**
     * Loads scripts
     *
     * @return {void}
     */
    async Load () {
        // Temp set that will replace one on class
        const scripts: IScript[] = []

        for await (const s of GetScripts(this.path)) {
            const e = scripts.find(eqName(s.name))
            if (e !== undefined) {
                // Duplicate (by-name) detected
                s.errors.push(`existing script with name "${s.name}"`)
            }

            scripts.push(s)
        }

        // Scripts loaded, replace set
        this.scripts = scripts
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
            log: new ScriptLogger()
        };



        const rval = script.fn(
            // Cast some of the common argument types
            // from plain javascript object to proper classes
            new ExecArgs(args),
            ctx
        );



        // Expand returned values into result if function returned an object
        // If anything else was returned, stack it under 'result' property
        let result = {};
        if (typeof rval === 'object') {
            result = { ...rval }
        } else {
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

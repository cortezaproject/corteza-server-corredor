import {Logger} from "./logger";
import {IScript, IExecContext, IExecResponse, ScriptSecurity} from "./d";
import {ExecArgs} from "./exec-args";

export interface IListFilter {
    query?:     string,
    resource?:  string,
    events?:    string[],
    security?:  ScriptSecurity
}

export interface IListFiterFn {
    (item: IScript): boolean
}

function match (f: IListFilter): IListFiterFn {
    return (item: IScript): boolean => {
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
                // @ts-ignore
                if (!item.events.includes(e)) {
                    return false
                }
            }
        }

        if (!!f.security && f.security !== item.security) {
            return false
        }

        if (!!f.query) {
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
    List (f: IListFilter = {}) : IScript[] {
        return this.scripts.filter(match(f))
    }
}

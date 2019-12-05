// @ts-ignore
import docblockParser from 'docblock-parser'
import { promises as fs } from 'fs'
import watch from 'node-watch'
import path from 'path'
import { debounce } from 'lodash'

const scriptExt = /\.(ts|js)$/

export enum ScriptSecurity {
    invoker = 'invoker',
    definer = 'definer',
}

export interface IScript {
    path:        string;
    name:        string;
    label:       string;
    description: string;
    resource:    string|undefined;
    events:      string[];
    security:    ScriptSecurity;
    fn:          any;
    errors:      string[];
}

/**
 * Populates & returns script object
 *
 * @param {string} filepath
 */
async function MakeScript(filepath : string) : Promise<IScript> {
    return await fs.readFile(filepath).then(source => {
        const name = path.basename(filepath)
        const rval : IScript = {
            path: filepath,
            name: '',
            label: name,
            description: '',
            resource: undefined,
            events: [],
            security: ScriptSecurity.invoker,
            fn: undefined,
            errors: []
        };

        const module = require(filepath)
        const symbols = Object.keys(module)

        if (symbols.length !== 1) {
            rval.errors.push('more than one export')
            return rval
        }

        if (!!module["default"]) {
            rval.errors.push('default export is not supported')
            return rval
        }

        if (typeof module[symbols[0]] !== 'function') {
            rval.errors.push('exported symbol must be of type function')
            return rval
        }

        try {
            const doc = source.toString().split('*/').shift()
            const { text, tags } = docblockParser({
                tags: {
                    resource: docblockParser.singleParameterTag,
                    event: docblockParser.multilineTilTag,
                    security: docblockParser.singleParameterTag,
                },
            }).parse(doc)
            const firstEol = text.indexOf("\n");
            rval.label = text.substring(0, firstEol);
            rval.description = text.substring(firstEol+1);
            rval.resource = tags.resource
            rval.events = tags.event

            if (tags.security == ScriptSecurity.definer) {
                rval.security = ScriptSecurity.definer
            }
        } catch (e) {
            rval.errors.push(e.toString())
            return rval
        }

        rval.name = symbols[0];
        rval.fn = module[symbols[0]];

        return rval
    })
}

/**
 * Recursively gathers scripts-like files and returns generator
 *
 * @param {string} path
 */
async function* getScripts (p : string): AsyncGenerator<IScript> {
    const ee = await fs.readdir(p, { withFileTypes: true });
    for (const e of ee) {
        const fp = path.resolve(p, e.name);
        if (e.isDirectory()) {
            yield* getScripts(fp);
        } else if (scriptExt.test(e.name)) {
            yield await MakeScript(fp)
        }
    }
}

/**
 *
 */
export class ServerScripts {
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
     * Watches path for changes and reloads scripts
     */
    Watch () {
        const opt = {
            persistent: false,
            recursive: true,
            delay: 200,
            filter: scriptExt,
        }

        const watcher = watch(this.path, opt, debounce((event: string, filename: string, ) => {
            this.Load()
        }, 500))

        process.on('SIGINT', watcher.close);
    }

    /**
     * Loads scripts
     */
    async Load () {
        // Truncate set
        this.scripts = []

        // And refill it with fresh data
        for await (const s of getScripts(this.path)) {
            this.scripts.push(s)
        }

        console.debug(`scripts reloaded (${this.scripts.length})`)
    }

    /**
     * Executes the script
     *
     * @param name
     * @param context
     */
    Exec (name: string, context: object): object {
        console.log('Exec', { name, context });

        const script = this.scripts.find(s => s.name === name);

        if (script === undefined) {
            throw new Error('Script not found')
        }

        return script.fn(context)
    }

    /**
     *
     */
    List () : IScript[] {
        return this.scripts
    }
}

import {promises as fs} from "fs";

// @ts-ignore
import docblockParser from 'docblock-parser'
import {DocBlockExtractor, IDocBlock, IScript, ScriptSecurity} from "./d";

export async function Maker(gen : AsyncGenerator<string>, basepath: string) : Promise<IScript[]> {
    let pp : Promise<IScript>[] = []

    for await (const scriptLocation of gen) {
        pp.push(MakeScript(scriptLocation, basepath))
    }

    return Promise.all(pp)
}

/**
 * Populates & returns script object
 *
 * @param {string} filepath
 */
export async function MakeScript(filepath : string, basepath : string) : Promise<IScript> {
    return await fs.readFile(filepath).then(source => {
        // Trim off leading path
        // @todo we trim too much of leading path
        let name = filepath.substring(basepath.length + 1)

        let rval : IScript = {
            name,
            label: name,
            events: [],
            security: ScriptSecurity.invoker,
            errors: []
        };

        try {
            // Remove from cache & (re)require the script
            delete require.cache[require.resolve(filepath)];
            const module = require(filepath);

            if (!module["default"]) {
                rval.errors.push('default export not found');
                return rval
            }

            if (typeof module["default"] !== 'function') {
                rval.errors.push('exported default must be of type function');
                return rval
            }

            rval.fn = module["default"];
        } catch (e) {
            rval.errors.push(e.toString());
        }

        try {
            rval = {
                ...rval,
                ...ParseDocBlock(source.toString())
            }
        } catch (e) {
            rval.errors.push(e.toString());
        }

        return rval
    })
}

export function ParseDocBlock(source : string) : IDocBlock {
// Split by end of comment
    const doc = (DocBlockExtractor.exec(source) || ['']).shift();
    if (!doc) {
        throw new Error('unable to parse docblock')
    }

    const { text, tags } = docblockParser({
        tags: {
            resource: docblockParser.singleParameterTag,
            event: docblockParser.multilineTilTag,
            security: docblockParser.singleParameterTag,
        },
    }).parse(doc);

    const firstEol = text.indexOf("\n");

    let label = text,
        description = ''

    if (firstEol > 0) {
        label = text.substring(0, firstEol)
        description = text.substring(firstEol+1)
    }

    return {
        label,
        description,
        resource: tags.resource,
        events: tags.event,
        security: tags.security,
    }
}

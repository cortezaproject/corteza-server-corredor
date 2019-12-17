/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { promises as fs } from 'fs'

// @ts-ignore
import docblockParser from 'docblock-parser'
import { DocBlockExtractor, DocBlock, Script, ScriptSecurity } from '.'

/**
 * Parses source and extracts docblock as structured object (DocBlock)
 * @param source
 * @constructor
 */
export function ParseDocBlock (source: string): DocBlock {
// Split by end of comment
  const doc = (DocBlockExtractor.exec(source) || ['']).shift()
  if (!doc) {
    throw new Error('unable to parse docblock')
  }

  const { text, tags } = docblockParser({
    tags: {
      resource: docblockParser.singleParameterTag,
      event: docblockParser.multilineTilTag,
      security: docblockParser.singleParameterTag
    }
  }).parse(doc)

  const firstEol = text.indexOf('\n')

  let label = text
  let description = ''

  if (firstEol > 0) {
    label = text.substring(0, firstEol)
    description = text.substring(firstEol + 1)
  }

  return {
    label,
    description,
    resource: tags.resource,
    events: tags.event,
    security: tags.security
  }
}
/**
 * Populates & returns script object
 *
 * @param {string} filepath
 * @param {string} basepath
 */
export async function MakeScript (filepath: string, basepath: string): Promise<Script> {
  return fs.readFile(filepath).then(source => {
    // Trim off leading path
    // @todo we trim too much of leading path
    const name = filepath.substring(basepath.length + 1)

    let rval: Script = {
      name,
      label: name,
      events: [],
      security: ScriptSecurity.invoker,
      errors: []
    }

    try {
      // We'll use require instead of import
      // because we need more control over cache (invalidation)

      // Remove from cache & (re)require the script
      delete require.cache[require.resolve(filepath)]

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require(filepath)

      if (!module.default) {
        rval.errors.push('default export not found')
        return rval
      }

      if (typeof module.default !== 'function') {
        rval.errors.push('exported default must be of type function')
        return rval
      }

      rval.fn = module.default
    } catch (e) {
      rval.errors.push(e.toString())
    }

    try {
      rval = {
        ...rval,
        ...ParseDocBlock(source.toString())
      }
    } catch (e) {
      rval.errors.push(e.toString())
    }

    return rval
  })
}

export async function Maker (gen: AsyncGenerator<string>, basepath: string): Promise<Script[]> {
  const pp: Promise<Script>[] = []

  for await (const scriptLocation of gen) {
    pp.push(MakeScript(scriptLocation, basepath))
  }

  return Promise.all(pp)
}

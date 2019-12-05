// @ts-ignore
import docblockParser from 'docblock-parser'
import fs from 'fs'
import path from 'path'

const usrDir = path.join(__dirname, '../usr')

const poc2 = path.join(usrDir, 'src/backend/system/poc2.ts')
const source = fs.readFileSync(poc2)

// Split on first end-of-comment and use first match.
let doc = source.toString().split('*/').shift()

console.log(docblockParser({
    tags: {
        resource: docblockParser.singleParameterTag,
        event: docblockParser.multilineTilTag,
        security: docblockParser.singleParameterTag,
    },
}).parse(doc))


// Validate
const r = require(poc2)

console.log(r)
// Should export only one symbol
const symbols = Object.keys(r)
console.log(symbols.length === 1)

// Should not export default
console.log(!r["default"])

// Exported symbol must be a function
console.log(typeof r[symbols[0]] === 'function')

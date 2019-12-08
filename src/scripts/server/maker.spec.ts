import { describe, it } from 'mocha'
import { expect } from 'chai'
import path from 'path'
import MakeScript, {ParseDocBlock} from "./maker";

describe('docblock parsing', () => {
    it('should parse a simple block', () => {
        const db = `/**\n * LABEL\n */`
        const p  = ParseDocBlock(db)
        expect(p.label).to.equal('LABEL')
        expect(p.description).empty
    })

    it('should parse a simple block with description', () => {
        const db = `/**\n * LABEL\n * Description...\n * multiline!\n */`
        const p  = ParseDocBlock(db)
        expect(p.label).to.equal('LABEL')
        expect(p.description).to.equal(`Description...\nmultiline!`)
    })

    it('should parse a full block', () => {
        const db = `/**\n * LABEL\n * Description...\n * multiline!\n * @resource foo\n * @event e1\n * @event e2\n * @security invoker\n */`
        const p  = ParseDocBlock(db)
        expect(p.label).to.equal('LABEL')
        expect(p.description).to.equal("Description...\nmultiline!")
        expect(p.resource).to.equal("foo")
        expect(p.events).to.deep.equal(['e1', 'e2'])
        expect(p.security).to.equal('invoker')
    })
})

describe('script making', () => {
    it('should parse itself', async () => {
        const script = await MakeScript(path.join(__dirname, 'maker.ts'), __dirname)
        expect(script.name).to.equal('maker')
        expect(script.fn).to.not.null
    })
})

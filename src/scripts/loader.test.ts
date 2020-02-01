import { describe, it } from 'mocha'
import { expect } from 'chai'
import { join } from 'path'
import { ClientScriptFilenameMatcher, LoadScript, ProcExports, ServerScriptFilenameMatcher } from './loader'
import { Trigger } from './trigger'

const baseScript = {
  name: 'scriptname',
  filepath: 'path/to/script',
}

describe(__filename, () => {
  describe('filename matchers', () => {
    it('should match server script filename matchers', () => {
      expect('simple.js').to.match(ServerScriptFilenameMatcher)
      expect('longer/path/to/the/script.js').to.match(ServerScriptFilenameMatcher)
      expect('not-jet-implemented.ts').not.to.match(ServerScriptFilenameMatcher)
      expect('js.ts').not.to.match(ServerScriptFilenameMatcher)
    })

    it('should properly extract server script name', () => {
      const { groups } = ServerScriptFilenameMatcher.exec('path/to/the/script.js')
      expect(groups).to.have.property('name').equal('path/to/the/script')
    })

    it('should match client script filename matchers', () => {
      expect('bundle/simple.js').to.match(ClientScriptFilenameMatcher)
      expect('bundle/longer/path/to/the/script.js').to.match(ClientScriptFilenameMatcher)
      expect('bundle/not-jet-implemented.ts').not.to.match(ClientScriptFilenameMatcher)
      expect('bundle/js.ts').not.to.match(ClientScriptFilenameMatcher)
    })

    it('should properly extract client script name and bundle', () => {
      const { groups } = ClientScriptFilenameMatcher.exec('bundle/script.js')
      expect(groups).to.have.property('name').equal('bundle/script')
      expect(groups).to.have.property('bundle').equal('bundle')
    })
  })

  describe('script loading', () => {
    it('should be able to load this file', async () => {
      const loadedScripts = await LoadScript({ filepath: join(__dirname, '_test', 'sample.js') }, __dirname, ServerScriptFilenameMatcher)
      expect(loadedScripts).to.have.length.greaterThan(0)
    })
  })

  describe('script resolving', () => {
    it('should complain about missing triggers & exec', async () => {
      const s = await ProcExports(baseScript, {})
      expect(s).to.have.property('errors').lengthOf(2)
      expect(s).to.have.property('errors').with.members([
        'invalid or undefined triggers',
        'exec callback missing',
      ])
    })

    it('should fully resolve script', async () => {
      const s = await ProcExports(baseScript, {
        label: 'label',
        description: 'description',
        security: {
          runAs: 'myself',
          deny: 'everyone',
          allow: ['admins', 'editors'],
        },
        triggers ({ on }: Trigger): Trigger[] {
          return [
            on('event').for('resource'),
            on('anotherEvent').for('anotherResource'),
          ]
        },
        exec (): void { /* void */ },
      })

      expect(s).to.have.property('errors').length(0)
      expect(s).to.have.property('exec').of.a('function')
      expect(s).to.have.property('triggers').lengthOf(2)
      expect(s).to.have.property('name').equal('scriptname')
      expect(s).to.have.property('filepath').equal('path/to/script')
      expect(s).to.have.property('label').equal('label')
      expect(s).to.have.property('description').equal('description')
      expect(s).to.have.property('security').deep.equal({
        runAs: 'myself',
        deny: ['everyone'],
        allow: ['admins', 'editors'],
      })
    })
  })
})

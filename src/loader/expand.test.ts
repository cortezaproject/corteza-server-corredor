import { describe, it } from 'mocha'
import { expect } from 'chai'
import { Trigger } from '../scripts/trigger'
import { ProcExports } from './expand'

const baseScript = {
  src: 'path/to/script',
  name: 'scriptname',
  updatedAt: new Date(),
}

describe(__filename, () => {
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
      expect(s).to.have.property('src').equal('path/to/script')
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

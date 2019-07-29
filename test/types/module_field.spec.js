import { expect } from 'chai'
import ModuleField from '../../src/types/module_field'

describe('module_field.js', () => {
  it('should set defaults', function () {
    const f = new ModuleField({ kind: 'String' })

    expect(f.fieldID).to.equal(undefined)
    expect(f.kind).to.equal('String')
    expect(f.isMulti).to.equal(false)
  })

  it('should respect preset values on merge', function () {
    const f = new ModuleField({ name: 'Foo', kind: 'String' })

    expect(f.name).to.equal('Foo')
    expect(f.kind).to.equal('String')
    expect(f.isMulti).to.equal(false)

    f.merge({ isMulti: true})

    expect(f.name).to.equal('Foo')
    expect(f.kind).to.equal('String')
    expect(f.isMulti).to.equal(true)

  })
})

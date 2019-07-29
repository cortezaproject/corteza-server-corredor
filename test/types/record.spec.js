/* eslint-disable */
/* ESLint didn't like some expects */

import { expect } from 'chai'
import Module from '../../src/types/module'
import ModuleField from '../../src/types/module_field'
import Record from '../../src/types/record'
import moment from 'moment'

const M = new Module({
  fields: [
    new ModuleField({name: 'str', kind: 'String'}),
    new ModuleField({name: 'num', kind: 'Number'}),
    new ModuleField({name: 'multi', kind: 'String', isMulti: true }),
  ]
})


function make(values) {
  return new Record(M, { values })
}

describe('record.js', () => {
  it('should properly translate value-set (from backend)', function () {
    const record = make([
      { name: 'str', value: 'should be overwritten...' },
      { name: 'str', value: 'SomeString' },
      { name: 'num', value: 123 },
      { name: 'multi', value: 'a' },
      { name: 'multi', value: 'b' },
      { name: 'multi', value: 'c' },
    ])

    expect(record.values.str).to.equal('SomeString')
    expect(record.values.num).to.equal(123)
    expect(record.values.multi).to.deep.equal(['a','b','c'])
  })

  it('should properly translate k-v values', function () {
    const record = make()

    record.setValues([
      { name: 'str', value: 'should be overwritten...' },
      { name: 'str', value: 'SomeString' },
      { name: 'num', value: 123 },
      { name: 'multi', value: 'a' },
      { name: 'multi', value: 'b' },
      { name: 'multi', value: 'c' },
    ])

    expect(record.values.str).to.equal('SomeString')
    expect(record.values.num).to.equal(123)
    expect(record.values.multi).to.deep.equal(['a','b','c'])
  })

  it('should properly translate k-v values', function () {
    const record = make()

    record.values = {
      str: 'SomeString',
      num: 123,
      multi: ['a','b','c'],
    }

    expect(record.values.str).to.equal('SomeString')
    expect(record.values.num).to.equal(123)
    expect(record.values.multi).to.deep.equal(['a','b','c'])
  })

  it('should properly append values to multi value fields', function () {
    const record = make({ multi: ['a','b','c'] })

    expect(record.values.multi).to.deep.equal(['a','b','c'])
    record.values.multi = ['a','b','c','d','e']
    expect(record.values.multi).to.deep.equal(['a','b','c','d','e'])
  })


  it('should properly handle numeric values', function () {
    const record = make({num: 123})

    record.values.num = 2
    expect(record.values.num).to.equal(2)
    record.values.num++
    expect(record.values.num).to.equal(3)
    record.values.num = 1 + record.values.num
    expect(record.values.num).to.equal(4)
  })

  it('should properly handle undefined value', function () {
    const record = make()
    expect(record.values.str).to.be.undefined
    record.values.str = undefined
    expect(record.values.str).to.be.undefined
    record.values.str = "foo"
    expect(record.values.str).to.be.a('string')
    record.values.str = undefined
    expect(record.values.str).to.be.undefined
  })

  it('should serialize properly', function () {
    const sv = make([
      { name: 'str', value: 'SomeString' },
      { name: 'num', value: 123 },
      { name: 'multi', value: 'a' },
      { name: 'multi', value: 'b' },
      { name: 'multi', value: 'c' },
    ]).serializeValues()

    expect(sv).to.deep.equal([
      { name: 'str', value: 'SomeString' },
      { name: 'num', value: '123' },
      { name: 'multi', value: 'a' },
      { name: 'multi', value: 'b' },
      { name: 'multi', value: 'c' },
    ])
  })
})

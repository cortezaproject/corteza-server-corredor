/* eslint-disable no-unused-expressions */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import path from 'path'
import { Parse } from './parser'

describe('docblock parsing', () => {
  it('should parse a simple block', () => {
    const db = '/**\n * LABEL\n */'
    const p = Parse(db)
    expect(p.label).to.equal('LABEL')
    expect(p.description).empty
  })

  it('should parse a simple block with description', () => {
    const db = '/**\n * LABEL\n * Description...\n * multiline!\n */'
    const p = Parse(db)
    expect(p.label).to.equal('LABEL')
    expect(p.description).to.equal('Description...\nmultiline!')
  })

  it('should parse a full block', () => {
    const db = '/**\n * LABEL\n * Description...\n * multiline!\n * @resource foo\n * @event e1\n * @event e2\n * @security invoker\n */'
    const p = Parse(db)
    expect(p.label).to.equal('LABEL')
    expect(p.description).to.equal('Description...\nmultiline!')
    expect(p.resource).to.equal('foo')
    expect(p.events).to.deep.equal(['e1', 'e2'])
    expect(p.security).to.equal('invoker')
  })
})

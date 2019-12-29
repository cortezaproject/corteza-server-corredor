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
    const db = `
/**
 * LABEL
 * Description...
 * multiline!
 *
 * @trigger {
 *     on: 'afterUpdate',
 *    for: 'compose:record',
 *     as: 'someuser'
 *   when: [
 *     {module: 'someModule', namespace: 'someNamespace'},
 *   ],
 * }
 *
 * @trigger {
 *     on: 'afterUpdate',
 *    for: 'compose:record',
 *     as: 'someuser'
 *   when: [
 *     {module: 'someModule', namespace: 'someNamespace'},
 *   ],
 * }
 */`
    const p = Parse(db)
    console.log(p)
    expect(p.label).to.equal('LABEL')
    expect(p.description).to.equal('Description...\nmultiline!')

    const t = '{\n' +
        "    on: 'afterUpdate',\n" +
        "   for: 'compose:record',\n" +
        "    as: 'someuser'\n" +
        '  when: [\n' +
        "    {module: 'someModule', namespace: 'someNamespace'},\n" +
        '  ],\n' +
        '}'

    expect(p.triggers).to.deep.equal([t, t])
  })
})

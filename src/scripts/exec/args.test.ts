/* eslint-disable @typescript-eslint/ban-ts-ignore,no-unused-expressions */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { Args } from './args'
import { cortezaTypes } from './args-corteza'
// @ts-ignore
import Module from 'corteza-webapp-common/src/lib/types/compose/module'

describe('arguments constructor', () => {
  it('should provide getter for a given arg', () => {
    const args = new Args({ foo: 'bar' })
    expect(args).to.haveOwnProperty('foo')
    expect(args).property('foo').eq('bar')
  })

  it('should not have undefined property', () => {
    const args = new Args({})
    expect(args).not.to.haveOwnProperty('foo')
  })

  it('should use caster', () => {
    const module = { moduleID: '42' }
    const args = new Args({ module }, cortezaTypes)
    expect(args).to.haveOwnProperty('$module')
    expect(args).to.haveOwnProperty('rawModule')
    expect(args).property('$module').instanceOf(Module)
    expect(args).property('rawModule').to.deep.eq(module)
  })
})

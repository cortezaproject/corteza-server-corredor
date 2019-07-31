/* eslint-disable */
/* ESLint didn't like some expects */

import { expect, assert } from 'chai'
import sinon from 'sinon'
import grpc from "grpc"
import scriptMaker from '../../../../src/grpc-server/services/script-runner/script-maker'
import {VMScript} from 'vm2'

const makeRq = (source = '', ctx = {}) => {
  return {
    JWT: "jwt.".repeat(100),
    script: { source },
    ...ctx,
  }
}

describe('script-maker.js', () => {
  beforeEach(() => {
    sinon.restore()
  })

  it('empty script', () => {
    expect(scriptMaker()).to.be.null
  })

  it('valid script', () => {
    expect(scriptMaker({ source: 'true' })).to.be.instanceOf(VMScript)
  })

  it('syntax error', () => {
    expect(() => { scriptMaker({ source: 'tr $ ue' }).compile() }).to.throw(SyntaxError)
  })
})

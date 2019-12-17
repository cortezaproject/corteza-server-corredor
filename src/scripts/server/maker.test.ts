/* eslint-disable no-unused-expressions */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import path from 'path'
import { MakeScript } from './maker'

describe('script making', () => {
  it('should parse itself', async () => {
    const script = await MakeScript(path.join(__dirname, 'maker.ts'), __dirname)
    expect(script.name).to.equal('maker.ts')
    expect(script.fn).to.not.null
  })
})

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { join } from 'path'
import { LoadScript } from './loader'

describe('script loading', () => {
  it('should be able to load this file', async () => {
    const loadedScripts = await LoadScript(join(__dirname, 'maker.test.ts'), __dirname)
    expect(loadedScripts).to.have.lengthOf(1)
  })
})

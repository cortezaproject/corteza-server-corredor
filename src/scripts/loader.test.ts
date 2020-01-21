import { describe, it } from 'mocha'
import { expect } from 'chai'
import { LoadScript } from './loader'

describe('script loading', () => {
  it('should be able to load this file', async () => {
    const loadedScripts = await LoadScript({ filepath: __filename }, __dirname)
    expect(loadedScripts).to.have.lengthOf(1)
  })
})

export default {
  triggers (): void { /* void */ },
  exec (): void { /* void */ },
}

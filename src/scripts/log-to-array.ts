const levels = {
  60: 'FATAL',
  50: 'ERROR',
  40: 'WARN ',
  30: 'INFO ',
  20: 'DEBUG',
  10: 'TRACE'
}

export class LogToArray {
  protected buf: string[] = []

  public lastTime: string
  public lastMsg: string
  public lastLevel: number

  constructor () {
    this[Symbol.for('pino.metadata')] = true
  }

  write (data: string) {
    const d = new Date(1970, 1, 1)
    d.setUTCMilliseconds(parseInt(this.lastTime))

    this.buf.push(`${d.toISOString()} ${levels[this.lastLevel]} ${this.lastMsg}`)
  }

  serialize (): string[] {
    // @todo returns a array of strings
    return this.buf
  }
}

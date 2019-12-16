import { format } from 'util'
import { EventType, Event } from './d'

/**
 * Makes new Event
 *
 * @param type
 * @param args
 */
function make (type: EventType, args: IArguments): Event {
  return {
    timestamp: new Date(),
    type,
    // @ts-ignore
    message: format.apply(this, args)
  }
}

/**
 * Simple logger to be used inside scripts
 *
 * More or less a console.*() replacement that provides most common functions
 * used with console.
 *
 * Gathers logged messages to internal buffer
 */
export class Logger {
    protected buf: Event[];

    constructor () {
      this.buf = []
    }

    getBuffer (): string[] {
      return this.buf.map(e => `${e.timestamp.toISOString()} ${e.type} ${e.message}`)
    }

    clear () {
      this.buf = []
    }

    log (data: any, ...args: any) {
      this.buf.push(make(EventType.info, arguments))
    }

    debug (data: any, ...args: any) {
      this.buf.push(make(EventType.debug, arguments))
    }

    info (data: any, ...args: any) {
      this.buf.push(make(EventType.info, arguments))
    }

    warn (data: any, ...args: any) {
      this.buf.push(make(EventType.warn, arguments))
    }

    error (data: any, ...args: any) {
      this.buf.push(make(EventType.error, arguments))
    }
}

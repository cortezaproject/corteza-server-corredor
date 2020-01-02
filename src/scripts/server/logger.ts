/* eslint-disable @typescript-eslint/ban-ts-ignore */

import { format } from 'util'
import { EventType, Event } from './types'

/**
 * Makes new Event
 *
 * @param type
 * @param args
 */
function make (type: EventType, args: unknown[]): Event {
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

    clear (): void {
      this.buf = []
    }

    log (data: unknown, ...args: unknown[]): void {
      this.buf.push(make(EventType.info, [data, ...args]))
    }

    debug (data: unknown, ...args: unknown[]): void {
      this.buf.push(make(EventType.debug, [data, ...args]))
    }

    info (data: unknown, ...args: unknown[]): void {
      this.buf.push(make(EventType.info, [data, ...args]))
    }

    warn (data: unknown, ...args: unknown[]): void {
      this.buf.push(make(EventType.warn, [data, ...args]))
    }

    error (data: unknown, ...args: unknown[]): void {
      this.buf.push(make(EventType.error, [data, ...args]))
    }
}

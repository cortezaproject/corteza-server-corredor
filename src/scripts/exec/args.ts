/* eslint-disable @typescript-eslint/ban-ts-ignore */

const oldPrefix = /^old([A-Z].+)$/

export interface GenericGetterFn<T> {
  (val: unknown): T;
}

export interface GetterFn {
  (key: unknown): unknown;
}

export type Caster = Map<string, GetterFn>

/**
 * Generic type caster
 *
 * Takes argument (ref to class) and returns a function that will initialize class of that type
 */
export function GenericCaster<T> (C: new (_: unknown) => T): GenericGetterFn<T> {
  return function (val: unknown): T {
    return new C(val)
  }
}

/**
 * Handles arguments, passed to the script
 *
 * By convention variables holding "current" resources are prefixed with dollar ($) sign.
 * For example, before/after triggers for record will call registered scripts with $record, $module
 * and $namespace, holding current record, it's module and namespace.
 *
 * All these variables are casted (if passed as an argument) to proper types ($record => Record, $module => Module, ...)
 */
export class Args {
  constructor (args: {[_: string]: unknown}, caster?: Caster) {
    for (const arg in args) {
      let kind = arg
      let freeze = false

      if (oldPrefix.test(arg)) {
        // oldFoo => foo
        kind = arg.substring(4).toLowerCase()
        freeze = true
      }

      if (caster && caster.has(kind) && caster.get(kind)) {
        // @ts-ignore
        let cast: ({(key: unknown): unknown}) = caster.get(kind)

        if (freeze) {
          // Freeze object if arg name prefixed with old
          cast = (val: unknown): unknown => cast.call(this, val)
        }

        Object.defineProperty(this, `$${arg}`, {
          get: () => cast.call(this, args[arg]),
          configurable: false,
          enumerable: true
        })

        Object.defineProperty(this, `raw${arg.substring(0, 1).toUpperCase()}${arg.substring(1)}`, {
          value: args[arg],
          writable: false,
          configurable: false,
          enumerable: true
        })
      } else {
        Object.defineProperty(this, arg, {
          value: args[arg],
          writable: false,
          configurable: false,
          enumerable: true
        })
      }
    }
  }
}

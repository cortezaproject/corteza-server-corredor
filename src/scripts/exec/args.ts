import User from 'corteza-webapp-common/src/lib/types/system/user'

const oldPrefix = /^old([A-Z].+)$/

export declare class BaseArgs {
    readonly $invoker: User
    readonly $authUser: User
    readonly authToken: string
}

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
 * Generic type caster with Object.freeze
 *
 * Takes argument (ref to class) and returns a function that will initialize class of that type
 */
export function GenericCasterFreezer<T> (C: new (_: unknown) => T): GenericGetterFn<T> {
  return function (val: unknown): T {
    return Object.freeze(new C(val))
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
      if (caster && caster.has(arg)) {
        const cast: ({(key: unknown): unknown}) = caster.get(arg)

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

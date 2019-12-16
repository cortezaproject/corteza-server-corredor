/* eslint-disable @typescript-eslint/ban-ts-ignore */

// @ts-ignore
import Namespace from 'corteza-webapp-common/src/lib/types/compose/namespace'
// @ts-ignore
import Module from 'corteza-webapp-common/src/lib/types/compose/module'
// @ts-ignore
import Record from 'corteza-webapp-common/src/lib/types/compose/record'
// @ts-ignore
import User from 'corteza-webapp-common/src/lib/types/system/user'
// @ts-ignore
import Role from 'corteza-webapp-common/src/lib/types/system/role'
// @ts-ignore
import Channel from 'corteza-webapp-common/src/lib/types/messaging/channel'

/**
 * Handles arguments, passed to the script
 *
 * By convention variables holding "current" resources are prefixed with dollar ($) sign.
 * For example, before/after triggers for record will call registered scripts with $record, $module
 * and $namespace, holding current record, it's module and namespace.
 *
 * All these variables are casted (if passed as an argument) to proper types ($record => Record, $module => Module, ...)
 */
export class ExecArgs {
    private args: Map<string, unknown>;

    constructor (args: {[_: string]: unknown}) {
      this.args = new Map()

      let arg: string
      for (arg in args) {
        if (Object.prototype.hasOwnProperty.call(this, arg)) {
          // We have our own getter to handle this

          // @ts-ignore
          this.args.set(arg, args[arg])
          continue
        }

        Object.defineProperty(this, arg, {
          // @ts-ignore
          value: args[arg],
          writable: false,
          enumerable: true
        })
      }
    }

    get jwt (): string {
      const jwt = this.args.get('jwt')
      if (typeof jwt === 'string') {
        return jwt
      }

      return ''
    }

    /**
     * Current record
     *
     * @returns {Record|undefined}
     */
    get $record (): Record|undefined {
      if (!this.args.has('$record')) {
        return undefined
      }

      return new Record(
        this.args.get('$record'),
        this.$module
      )
    }

    /**
     * Current module
     *
     * @returns {Module|undefined}
     */
    get $module (): Module|undefined {
      if (!this.args.has('$module')) {
        return undefined
      }

      return new Module(this.args.get('$module'))
    }

    /**
     * Current namespace
     *
     * @returns {Namespace|undefined}
     */
    get $namespace (): Namespace|undefined {
      if (!this.args.has('$namespace')) {
        return undefined
      }

      return new Namespace(this.args.get('$namespace'))
    }

    /**
     * Current user
     *
     * @returns {User|undefined}
     */
    get $user (): User|undefined {
      if (!this.args.has('$user')) {
        return undefined
      }

      return new User(this.args.get('$user'))
    }

    /**
     * Current role
     *
     * @returns {Role|undefined}
     */
    get $role (): Role|undefined {
      if (!this.args.has('$role')) {
        return undefined
      }

      return new Role(this.args.get('$role'))
    }

    /**
     * Current channel
     *
     * @returns {Channel|undefined}
     */
    get $channel (): Channel|undefined {
      if (!this.args.has('$channel')) {
        return undefined
      }

      return new Channel(this.args.get('$channel'))
    }
}

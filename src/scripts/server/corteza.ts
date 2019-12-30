/* eslint-disable @typescript-eslint/ban-ts-ignore */

// @ts-ignore
import ComposeObject from 'corteza-webapp-common/src/lib/types/compose/common'
// @ts-ignore
import Namespace from 'corteza-webapp-common/src/lib/types/compose/namespace'
// @ts-ignore
import Module from 'corteza-webapp-common/src/lib/types/compose/module'
// @ts-ignore
import Record from 'corteza-webapp-common/src/lib/types/compose/record'
// @ts-ignore
import SystemObject from 'corteza-webapp-common/src/lib/types/system/common'
// @ts-ignore
import User from 'corteza-webapp-common/src/lib/types/system/user'
// @ts-ignore
import Role from 'corteza-webapp-common/src/lib/types/system/role'
// @ts-ignore
import MessagingObject from 'corteza-webapp-common/src/lib/types/messaging/common'
// @ts-ignore
import Channel from 'corteza-webapp-common/src/lib/types/messaging/channel'

export type Result = void | Promise<unknown> | unknown

export declare class BaseArgs {
    readonly $invoker: User
    readonly $authUser: User
    readonly authToken: string
}

export declare class ComposeRecordArgs extends BaseArgs {
    readonly $record: Record
    readonly $oldRecord: Record
    readonly $module: Module
    readonly $namespace: Namespace
}

export declare class ComposeModuleArgs extends BaseArgs {
    readonly $module: Module
    readonly $oldModule: Module
    readonly $namespace: Namespace
}

export declare class ComposeNamespaceArgs extends BaseArgs {
    readonly $namespace: Namespace
    readonly $oldNamespace: Namespace
}

// @todo declare args for page
// @todo declare args for application
// @todo declare args for user
// @todo declare args for role
// @todo declare args for channel
// @todo declare args for message

interface GetterFn {
    (key: unknown): unknown;
}

interface GenericGetterFn<T> {
    (val: unknown): T;
}

function genericConstructor<T> (C: new (_: unknown) => T): GenericGetterFn<T> {
  return function (val: unknown): T {
    return new C(val)
  }
}

function recordConstructor (): GenericGetterFn<Record> {
  return function (val: unknown): Record {
    return new Record(
      // @ts-ignore
      this.$module,
      val
    )
  }
}

export const cortezaTypes: Map<string, GetterFn> = new Map()

cortezaTypes.set('authUser', genericConstructor(User))
cortezaTypes.set('invoker', genericConstructor(User))

cortezaTypes.set('record', recordConstructor())
cortezaTypes.set('module', genericConstructor(Module))
cortezaTypes.set('page', genericConstructor(ComposeObject))
cortezaTypes.set('namespace', genericConstructor(Namespace))
cortezaTypes.set('application', genericConstructor(SystemObject))
cortezaTypes.set('user', genericConstructor(User))
cortezaTypes.set('role', genericConstructor(Role))
cortezaTypes.set('channel', genericConstructor(Channel))
cortezaTypes.set('message', genericConstructor(MessagingObject))


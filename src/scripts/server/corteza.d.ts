/* eslint-disable @typescript-eslint/ban-ts-ignore */

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

declare class BaseArgs {
    readonly $invoker: User
    readonly $authUser: User
    readonly authToken: string
}

declare class ComposeRecordArgs extends BaseArgs {
    readonly $record: Record
    readonly $oldRecord: Record
    readonly $module: Module
    readonly $namespace: Namespace
}

declare class ComposeModuleArgs extends BaseArgs {
    readonly $module: Module
    readonly $oldModule: Module
    readonly $namespace: Namespace
}

declare class ComposeNamespaceArgs extends BaseArgs {
    readonly $namespace: Namespace
    readonly $oldNamespace: Namespace
}

declare class SystemUserArgs extends BaseArgs {
    readonly $user: User
    readonly $oldUser: User
}

declare class SystemRoleArgs extends BaseArgs {
    readonly $role: Role
    readonly $oldRole: Role
}

declare class SystemApplicationArgs extends BaseArgs {
    readonly $application: SystemObject
    readonly $oldApplication: SystemObject
}

declare class MessagingChannelArgs extends BaseArgs {
    readonly channel: Channel
    readonly $oldChannel: Channel
}

declare class MessagingMessageArgs extends BaseArgs {
    readonly $message: MessagingObject
    readonly $oldMesage: MessagingObject
    readonly channel: Channel
}

export declare type Result = void | Promise<unknown> | unknown

// @todo declare args for page
// @todo declare args for application
// @todo declare args for user
// @todo declare args for role
// @todo declare args for channel
// @todo declare args for message

declare function GenericGetterFn<T> (val: unknown): T;
declare function GetterFn(key: unknown): unknown

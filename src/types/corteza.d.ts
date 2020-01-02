/* eslint-disable @typescript-eslint/ban-ts-ignore */

// @ts-ignore
import ComposeApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/compose'
// @ts-ignore
import MessagingApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/messaging'
// @ts-ignore
import SystemApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/system'
// @ts-ignore
import ComposeHelper from 'corteza-webapp-common/src/lib/automation-scripts/context/compose'
// @ts-ignore
import MessagingHelper from 'corteza-webapp-common/src/lib/automation-scripts/context/messaging'
// @ts-ignore
import SystemHelper from 'corteza-webapp-common/src/lib/automation-scripts/context/system'
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

export declare class SystemUserArgs extends BaseArgs {
    readonly $user: User
    readonly $oldUser: User
}

export declare class SystemRoleArgs extends BaseArgs {
    readonly $role: Role
    readonly $oldRole: Role
}

export declare class SystemApplicationArgs extends BaseArgs {
    readonly $application: SystemObject
    readonly $oldApplication: SystemObject
}

export declare class MessagingChannelArgs extends BaseArgs {
    readonly channel: Channel
    readonly $oldChannel: Channel
}

export declare class MessagingMessageArgs extends BaseArgs {
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

export declare interface GenericGetterFn<T> {
    (val: unknown): T;
}

export declare interface GetterFn {
    (key: unknown): unknown;
}

export declare class ExecContext {
    $authUser: Promise<User>;
    SystemAPI: SystemApiClient;
    ComposeAPI: ComposeApiClient;
    MessagingAPI: MessagingApiClient;
    System: SystemHelper;
    Compose: ComposeHelper;
    Messaging: MessagingHelper;
}

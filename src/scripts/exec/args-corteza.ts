/* eslint-disable @typescript-eslint/ban-ts-ignore */

import { Caster, GenericCaster, GenericCasterFreezer } from './args'

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


/**
 * Record type caster
 *
 * Record arg is a bit special, it takes 2 params (record itself + record's module)
 */
function recordCaster (val: unknown): Record {
  return new Record(this.$module, val)
}

function recordCasterFreezer (val: unknown): Record {
  return Object.freeze(new Record(this.$module, val))
}

/**
 * cortezaTypes map helps ExecArgs class with translation of (special) arguments
 * to their respected types
 *
 * There's noe need to set/define casters for old* arguments,
 * It's auto-magically done by Args class
 */
export const cortezaTypes: Caster = new Map()

cortezaTypes.set('authUser', GenericCasterFreezer(User))
cortezaTypes.set('invoker', GenericCasterFreezer(User))
cortezaTypes.set('module', GenericCaster(Module))
cortezaTypes.set('oldModule', GenericCasterFreezer(Module))
cortezaTypes.set('page', GenericCaster(ComposeObject))
cortezaTypes.set('oldPage', GenericCasterFreezer(ComposeObject))
cortezaTypes.set('namespace', GenericCaster(Namespace))
cortezaTypes.set('oldNamespace', GenericCasterFreezer(Namespace))
cortezaTypes.set('application', GenericCaster(SystemObject))
cortezaTypes.set('oldApplication', GenericCasterFreezer(SystemObject))
cortezaTypes.set('user', GenericCaster(User))
cortezaTypes.set('oldUser', GenericCasterFreezer(User))
cortezaTypes.set('role', GenericCaster(Role))
cortezaTypes.set('oldRole', GenericCasterFreezer(Role))
cortezaTypes.set('channel', GenericCaster(Channel))
cortezaTypes.set('oldChannel', GenericCasterFreezer(Channel))
cortezaTypes.set('message', GenericCaster(MessagingObject))
cortezaTypes.set('oldMessage', GenericCasterFreezer(MessagingObject))
cortezaTypes.set('record', recordCaster)
cortezaTypes.set('oldRecord', recordCasterFreezer)

import {ComposeObject, ISO8601, Prop} from './common'

export default class Namespace extends ComposeObject {
  constructor (n = {}) {
    super()
    this.namespaceID = Prop(String, n.namespaceID)
    this.name = Prop(String, n.name)
    this.slug = Prop(String, n.slug)
    this.enabled = !!n.enabled
    this.meta = Prop(Object, n.meta)

    this.createdAt = Prop(ISO8601, n.createdAt)
    this.updatedAt = Prop(ISO8601, n.updatedAt)
    this.deletedAt = Prop(ISO8601, n.deletedAt)

    this.canCreateChart = !!n.canCreateChart
    this.canCreateModule = !!n.canCreateModule
    this.canCreatePage = !!n.canCreatePage
    this.canCreateTrigger = !!n.canCreateTrigger
    this.canDeleteNamespace = !!n.canDeleteNamespace
    this.canUpdateNamespace = !!n.canUpdateNamespace
    this.canManageNamespace = !!n.canManageNamespace
    this.canGrant = !!n.canGrant
  }
}

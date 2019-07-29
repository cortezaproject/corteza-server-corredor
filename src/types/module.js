import ModuleField from './module_field'
import {ArrayOf, ComposeObject, ISO8601, Prop} from './common'

export default class Module extends ComposeObject {
  constructor (m = {}) {
    super()
    this.moduleID = Prop(String, m.moduleID)
    this.namespaceID = Prop(String, m.namespaceID)
    this.name = Prop(String, m.name)

    this.fields = Prop(ArrayOf(ModuleField), m.fields, [])

    this.createdAt = Prop(ISO8601, m.createdAt)
    this.updatedAt = Prop(ISO8601, m.updatedAt)
    this.deletedAt = Prop(ISO8601, m.deletedAt)

    this.canUpdateModule = !!m.canUpdateModule
    this.canDeleteModule = !!m.canDeleteModule
    this.canCreateRecord = !!m.canCreateRecord
    this.canReadRecord = !!m.canReadRecord
    this.canUpdateRecord = !!m.canUpdateRecord
    this.canDeleteRecord = !!m.canDeleteRecord
    this.canGrant = !!m.canGrant
  }

  // Returns array of fields from this module that are in requested list (array of field object or string).
  // Returned fields are orderd in the same way as requested
  filterFields (requested = []) {
    return requested
      .map(r =>
        this.fields.find(f => (r.name || r) === f.name))
      .filter(f => f)
  }

  fieldNames () {
    return this.fields.map(f => f.name)
  }
}

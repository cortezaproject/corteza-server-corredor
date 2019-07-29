import {Prop} from './common'

export default class ModuleField {
  constructor (def = {}) {
    this.merge(def)
  }

  merge (m = {}) {
    m = { ...this, ...m }

    this.fieldID = Prop(String, m.fieldID)
    this.name = Prop(String, m.name)
    this.kind = Prop(String, m.kind)
    this.isMulti = !!m.isMulti
  }
}

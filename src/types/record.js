import Module from './module'
import {Prop, ISO8601, ComposeObject} from './common'

const fields = Symbol('moduleFieldIndex')
const resetValues = Symbol('resetValues')

const reservedFieldNames = [
  'toJSON',
]

// Record class
export default class Record extends ComposeObject {
  constructor (m, r = {}) {
    super()
    if (m instanceof Record) {
      // Trying to copy a record
      r = { ...m }
      m = r.module
    }


    if (m === undefined) {
      throw new Error('invalid module (undefined)')
    } else if (!(m instanceof Module)) {
      throw new Error(`invalid module type (${typeof m === 'object' && m && m.constructor ? m.constructor.name : typeof m})`)
    }

    this.module = m
    this.moduleID = Prop(String, m.moduleID)
    this.namespaceID = Prop(String, m.namespaceID)

    this[fields] = {}
    this.module.fields.forEach(({ name, isMulti, kind }) => {
      this[fields][name] = { isMulti, kind }
    })

    this[resetValues]()

    this.recordID = Prop(String, r.recordID)

    this.ownedBy = Prop(String, r.ownedBy)
    this.createdBy = Prop(String, r.createdBy)
    this.updatedBy = Prop(String, r.updatedBy)
    this.deletedBy = Prop(String, r.deletedBy)

    this.createdAt = Prop(ISO8601, r.createdAt)
    this.updatedAt = Prop(ISO8601, r.updatedAt)
    this.deletedAt = Prop(ISO8601, r.deletedAt)

    if (r.values !== undefined && Array.isArray(r.values)) {
      this.setValues(r.values)
    } else if (typeof r.values === 'object') {
      this.values = r.values
    }
  }

  [resetValues] () {
    this.values = {
      toJSON: () => {
        // Remove unneeded properties
        return this.serializeValues()
      },
    }

    this.module.fields.forEach(({ name, isMulti, kind }) => {
      if (reservedFieldNames.includes(name)) {
        throw new Error('can not use reserved field name ' + name)
      }

      this[fields][name] = { isMulti, kind }
      this.values[name] = isMulti ? [] : undefined
    })
  }

  serializeValues () {
    let arr = []

    for (let name in this.values) {
      if (!this.values.hasOwnProperty(name)) {
        continue
      }

      if (this[fields][name] === undefined) {
        continue
      }

      const { isMulti = false } = this[fields][name]

      if (isMulti) {
        if (Array.isArray(this.values[name])) {
          for (let i = 0; i < this.values[name].length; i++) {
            if (this.values[name][i] !== undefined) {
              arr.push({ name, value: this.values[name][i].toString() })
            }
          }
        }
      } else if (this.values[name] !== undefined) {
        arr.push({ name, value: this.values[name].toString() })
      }
    }

    return arr
  }

  setValues (input = []) {
    if (Array.isArray(input)) {
      input.filter(({name}) => this[fields][name] !== undefined).forEach(({name, value}) => {
        const {isMulti = false} = this[fields][name]
        if (isMulti) {
          this.values[name].push(value)
        } else {
          this.values[name] = value
        }
      })
    } else if (typeof input === 'object') {
      const values = (input instanceof Record) ? input.values : input

      for (let p in input) {
        this.values[p] = values[p]
      }
    } else {
      throw Error('expecting array of values')
    }
  }

  isValid () {
    return this.module.fields
      .map(f => f.validate(this.values[f.name]).length === 0)
      .filter(v => !v).length === 0
  }
}

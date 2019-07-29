const iso8601check = /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/
const uint64zeropad = '00000000000000000000'

export class ComposeObject {}

function isNativeClass (thing) {
  return typeof thing === 'function' && thing.hasOwnProperty('prototype') && !thing.hasOwnProperty('arguments')
}

export function Prop(type, value, def = undefined) {
  if (value === undefined) {
    return def
  }

  return type(value)
}

export function ISO8601(value) {
  if (!value || !isISO8601(value)) {
    return undefined
  }

  return String(value)
}

export function isISO8601(value) {
  return iso8601check.test(value)
}

export function SortableID(ID) {
  // We're using uint64 for ID and JavaScript does not know how to handle this type
  // natively. We get the value from backend as string anyway and we need to prefix
  // it with '0' to ensure string sorting does what we need it to.
  this.sortKey = uint64zeropad.substr((ID || '').length) + (ID || '')
}

export function ArrayOf(type) {
  return (vv) => vv.map(v => (isNativeClass(type) ? new type(v) : type(v)))
}

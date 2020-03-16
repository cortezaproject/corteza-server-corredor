const defaultResource = 'system'

/**
 * Using this for function testing
 */
const generatorSample = function * (): unknown { yield undefined }
const isGenerator = (t): boolean => {
  return (typeof t === 'function') && (t.constructor === generatorSample.constructor)
}

interface Constraint {
  name?:
      string;
  op?:
      string;
  value:
      string[];
}

interface UIProp {
  name: string;
  value: string;
}

function distinct (arr: string[]): string[] {
  return arr.filter((n, i) => arr.indexOf(n) === i)
}

// prefixes and captializes list of given event names
function eventize (prefix: string, ee: string[]): string[] {
  return ee.map(e => prefix + e.substring(0, 1).toUpperCase() + e.substring(1))
}

export class Trigger {
  readonly eventTypes:
      string[] = [];

  readonly resourceTypes:
      string[] = [];

  readonly constraints:
      Constraint[] = [];

  readonly uiProps:
      UIProp[] = [];

  constructor (t?: Partial<Trigger>) {
    if (!t) {
      return
    }

    this.eventTypes = t.eventTypes || []
    this.resourceTypes = t.resourceTypes || []
    this.constraints = t.constraints || []
    this.uiProps = t.uiProps || []
  }

  on (...events: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      eventTypes: distinct([...t.eventTypes, ...eventize('on', events)]),
    })
  }

  before (...events: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      eventTypes: distinct([...t.eventTypes, ...eventize('before', events)]),
    })
  }

  after (...events: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      eventTypes: distinct([...t.eventTypes, ...eventize('after', events)]),
    })
  }

  for (...resources: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      resourceTypes: distinct([...t.resourceTypes, ...resources]),
    })
  }

  at (...intervals: string[]): Trigger {
    return (this ?? new Trigger()).deferred('onTimestamp', intervals)
  }

  every (...intervals: string[]): Trigger {
    return (this ?? new Trigger()).deferred('onInterval', intervals)
  }

  where (...aa: unknown[]): Trigger {
    let name: string|undefined
    let op: string|undefined
    let value: string[]

    if (aa.length > 1) {
      // More than 1 argument, assuming first is constraint's name
      name = (aa.shift() as string)
    }

    if (aa.length > 1) {
      // More than 2 arguments, assuming 2nd is operator
      op = (aa.shift() as string)
    }

    // There rest of arguments are values
    if (aa.length === 1 && Array.isArray(aa[0])) {
      value = aa[0]
    } else if (aa.length === 1) {
      value = [(aa[0] as string)]
    } else {
      value = (aa as string[])
    }

    const { constraints } = this
    constraints.push({ name, op, value })

    return new Trigger({ ...this, constraints })
  }

  uiProp (name: string, value: string): Trigger {
    const t = this ?? new Trigger()
    return new Trigger({ ...t, uiProps: [...t.uiProps, { name, value }] })
  }

  private deferred (eventType: string, value: string[]): Trigger {
    const t = this ?? new Trigger()

    // Not allow to be combined with other event types
    if (t.eventTypes.length > 0 && t.eventTypes.find(e => e === eventType)) {
      throw SyntaxError('not allowed to combine interval with other event types')
    }

    // Not allow to be combined with other resource types
    if (t.resourceTypes.length > 0 && t.resourceTypes.find(e => e.indexOf(':') > -1)) {
      throw SyntaxError('not allowed to use interval on non-service resources')
    }

    let constraints: Constraint[] = t.constraints
    if (constraints.length > 0) {
      constraints[0].value.push(...value)
    } else {
      constraints = [{ value }]
    }

    const { resourceTypes } = this
    if (resourceTypes.length === 0) {
      resourceTypes.push(defaultResource)
    }

    return new Trigger({ ...this, resourceTypes: resourceTypes, eventTypes: [eventType], constraints })
  }
}

/**
 * Makes triggers out of an input params
 */
export function Make (t: unknown): Trigger[] {
  let tt = []

  if (typeof t === 'function') {
    // Execute trigger callback to convert to array of triggers
    // and overwrite the function with definition
    if (isGenerator(t)) {
      t = [...t(new Trigger())]
    } else {
      t = t(new Trigger())
    }
  }

  if (Array.isArray(t)) {
    tt = [...t]
  } else {
    tt = [t]
  }

  return tt.filter(t => t instanceof Trigger)
}

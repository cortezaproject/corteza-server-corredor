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

interface PlainTrigger {
  events?:
    string[];
  resources?:
    string[];
  constraints?:
    Constraint[];
  runAs?:
    string;
}

function distinct (arr: string[]): string[] {
  return arr.filter((n, i) => arr.indexOf(n) === i)
}

// prefixes and captializes list of given event names
function eventize (prefix: string, ee: string[]): string[] {
  return ee.map(e => prefix + e.substring(0, 1).toUpperCase() + e.substring(1))
}

export class Trigger {
  readonly events:
      string[];

  readonly resources:
      string[];

  readonly constraints:
      Constraint[];

  readonly runAs?:
      string;

  constructor (t?: Trigger | PlainTrigger) {
    if (t !== undefined) {
      this.events = t.events ?? []
      this.resources = t.resources ?? []
      this.constraints = t.constraints ?? []
      this.runAs = t.runAs
    } else {
      this.events = []
      this.resources = []
      this.constraints = []
      this.runAs = undefined
    }
  }

  as (runAs: string): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({ ...t, runAs })
  }

  on (...events: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      events: distinct([...t.events, ...eventize('on', events)]),
    })
  }

  before (...events: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      events: distinct([...t.events, ...eventize('before', events)]),
    })
  }

  after (...events: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      events: distinct([...t.events, ...eventize('after', events)]),
    })
  }

  for (...resources: string[]): Trigger {
    const t = this ?? new Trigger()

    return new Trigger({
      ...t,
      resources: distinct([...t.resources, ...resources]),
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

  private deferred (eventType: string, value: string[]): Trigger {
    const t = this ?? new Trigger()

    // Do not procede if this was called on incompatible trigger
    if (t.events.length > 0 && t.events.find(e => e === eventType)) {
      throw SyntaxError('not allowed to combine interval with other event types')
    }

    if (t.resources.length > 0 && t.resources.find(e => e.indexOf(':') > -1)) {
      throw SyntaxError('not allowed to use interval on non-service resources')
    }

    let constraints: Constraint[] = t.constraints
    if (constraints.length > 0) {
      constraints[0].value.push(...value)
    } else {
      constraints = [{ value }]
    }

    const { resources } = this
    if (resources.length === 0) {
      resources.push(defaultResource)
    }

    return new Trigger({ ...this, resources, events: [eventType], constraints })
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
      tt = [...t(new Trigger())]
    } else {
      tt = t(new Trigger())
    }
  } else if (Array.isArray(t)) {
    tt = [...t]
  } else if (t instanceof Trigger) {
    tt = [t]
  }

  return tt.filter(t => t instanceof Trigger)
}

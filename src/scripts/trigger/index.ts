const defaultResource = 'system'

interface Constraint {
  name?:
      string;
  op?:
      string;
  value:
      string[];
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

  constructor (t?: Trigger) {
    if (t !== undefined) {
      this.events = t.events
      this.resources = t.resources
      this.constraints = t.constraints
      this.runAs = t.runAs
    } else {
      this.events = []
      this.resources = []
      this.constraints = []
      this.runAs = undefined
    }
  }

  as (runAs: string): Trigger {
    return new Trigger({ ...this, runAs })
  }

  on (...events: string[]): Trigger {
    return new Trigger({
      ...this,
      events: distinct([...this.events, ...eventize('on', events)])
    })
  }

  before (...events: string[]): Trigger {
    return new Trigger({
      ...this,
      events: distinct([...this.events, ...eventize('before', events)])
    })
  }

  after (...events: string[]): Trigger {
    return new Trigger({
      ...this,
      events: distinct([...this.events, ...eventize('after', events)])
    })
  }

  for (...resources: string[]): Trigger {
    return new Trigger({
      ...this,
      resources: distinct([...this.resources, ...resources])
    })
  }

  at (...intervals: string[]): Trigger {
    return this.deferred('onTimestamp', intervals)
  }

  every (...intervals: string[]): Trigger {
    return this.deferred('onInterval', intervals)
  }

  where (...aa: unknown[]): Trigger {
    let name: string|undefined
    let op: string|undefined
    let value: string[]

    if (aa.length > 1) {
      // More than 1 argument, assuming first is constraint's name
      name = (aa.pop() as string)
    }

    if (aa.length > 1) {
      // More than 2 arguments, assuming 2nd is operator
      op = (aa.pop() as string)
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
    // Do not procede if this was called on incompatible trigger
    if (this.events.length > 0 && this.events.find(e => e === eventType)) {
      throw SyntaxError('not allowed to combine interval with other event types')
    }

    if (this.resources.length > 0 && this.resources.find(e => e.indexOf(':') > -1)) {
      throw SyntaxError('not allowed to use interval on non-service resources')
    }

    let constraints: Constraint[] = this.constraints
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

const baseTrigger: TriggerBase = new Trigger()
export default baseTrigger

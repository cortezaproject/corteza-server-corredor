type EqPairConstraint = {[_: string]: string}
type OpPairConstraint = {[_: string]: {[_: string]: string}}
type RawConstraint = string | Array<string> | EqPairConstraint | OpPairConstraint

/**
 * Simplified DSL
 */
interface RawDSL {
  // Events
  on?:
      string | string[];

  // Resources
  for?:
      string | string[];

  // Run as
  as?:
      string;

  // Constraints
  when?:
      RawConstraint;
}

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

function castConstraints (c: RawConstraint | undefined): Constraint[] {
  const cc: Constraint[] = []

  switch (true) {
    case (c === undefined):
      break

    case (typeof c === 'string'):
      cc.push({ value: [c] } as Constraint)
      break

    case Array.isArray(c):
      [...(c as string[])].forEach((s: string) => cc.push(...castConstraints(s)))
      break

    case (typeof c === 'object'):
      for (const name in (c as OpPairConstraint | EqPairConstraint)) {
        const pair = (c as OpPairConstraint | EqPairConstraint)

        if (!Object.prototype.hasOwnProperty.call(pair, name)) {
          continue
        }

        if (pair[name] === 'string') {
          cc.push({ name, value: [pair[name]] } as Constraint)
          continue
        }

        if (pair[name] === 'object') {
          // abusing EqPairConstraint for OpPairConstraint prop values
          const opPair = (pair[name] as EqPairConstraint)
          const ops = Object.getOwnPropertyNames(opPair)
          if (ops.length !== 1) {
            throw new Error('expecting exactly one operator')
          }

          const op = ops[0]
          const value = opPair[ops[0]]

          cc.push({ name, op, value: [value] } as Constraint)
        }
      }
      break
  }

  return cc
}

export class Trigger {
  readonly events:
      string[];

  readonly resources:
      string[];

  readonly runAs?:
      string;

  readonly constraints:
      Constraint[];

  /**
   * Resolves given raw DSL struct into Trigger class
   *
   * @param t
   */
  constructor (t: RawDSL) {
    this.events = []
    if (t.on !== undefined) {
      this.events = distinct(Array.isArray(t.on) ? t.on : [t.on])
    }

    this.resources = []
    if (t.for !== undefined) {
      this.resources = distinct(Array.isArray(t.for) ? t.for : [t.for])
    }

    if (t.as !== undefined) {
      this.runAs = t.as
    }

    this.constraints = castConstraints(t.when)
  }
}

/* eslint-disable no-unused-expressions,@typescript-eslint/no-empty-function,@typescript-eslint/ban-ts-ignore */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { Service, ExecArgsRaw, ScriptFn } from '.'
import { Trigger } from '../trigger'

const serviceConfig = {
  cServers: {
    system: { apiBaseURL: 'unit-test' },
    compose: { apiBaseURL: 'unit-test' },
    messaging: { apiBaseURL: 'unit-test' }
  }
}

class Dummy {}

describe('scripts list', () => {
  describe('empty', () => {
    it('should be empty', () => {
      const svc = new Service(serviceConfig)
      expect(svc.List()).to.have.lengthOf(0)
    })
  })

  describe('filled', () => {
    const svc = new Service(serviceConfig)
    beforeEach(() => {
      svc.Update([
        {
          label: 'label1',
          name: 'Name',
          description: 'deskription',
          errors: [],
          triggers: [
            new Trigger({ on: 'foo', for: 'res1' })
          ]
        },
        {
          label: 'label2',
          name: 'Name',
          description: 'deskription',
          errors: [],
          triggers: [
            new Trigger({ on: 'afterMyThing', for: 'res2' })
          ]
        },
        {
          label: 'label3',
          name: 'Name',
          description: 'deskription',
          errors: [],
          triggers: [
            new Trigger({ on: ['beforeMyThing', 'afterMyThing'], for: 'res2' })
          ]
        }
      ])
    })

    it('should match all 3 with "abel"', () => {
      expect(svc.List({ query: 'abel' })).to.have.lengthOf(3)
    })

    it('should match 1 with labe1', () => {
      expect(svc.List({ query: 'label1' })).to.have.lengthOf(1)
    })

    it('should match all 3 with description', () => {
      expect(svc.List({ query: 'deskr' })).to.have.lengthOf(3)
    })

    it('should match 2 with res2 for resource', () => {
      expect(svc.List({ resource: 'res2' })).to.have.lengthOf(2)
    })

    it('should match none with re for resource', () => {
      expect(svc.List({ resource: 're' })).to.have.lengthOf(0)
    })

    it('should match 2 with events', () => {
      expect(svc.List({ events: ['afterMyThing'] })).to.have.lengthOf(2)
    })

    it('should match 1 with event', () => {
      expect(svc.List({ events: ['beforeMyThing'] })).to.have.lengthOf(1)
    })

    it('should match all with no events', () => {
      expect(svc.List({ events: [] })).to.have.lengthOf(3)
    })
  })
})

interface CheckerFnArgs {
    result?: {[_: string]: unknown}|unknown;
    logs?: string[];
    error?: Error;
}

interface CheckerFn {
    (_: CheckerFnArgs): void;
}

describe('execution', () => {
  const execIt = (name: string, check: CheckerFn, fn: ScriptFn, args: ExecArgsRaw = {}): void => {
    it(name, async () => {
      // Script maker
      const svc = new Service(serviceConfig)
      svc.Update([{
        name,
        errors: [],
        triggers: [],
        handler: fn
      }])

      svc.Exec(name, args)
        .then(check)
        .catch((error: Error|undefined) => check({ error })
        )
    })
  }

  execIt(
    'empty',
    () => {},
    () => {}
  )

  execIt(
    'should get true when returning true',
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({ result: true })
    },

    () => true
  )

  execIt(
    'should get error with returning false',
    ({ result, error }: CheckerFnArgs) => {
      expect(result).to.be.undefined
      expect(error).to.be.instanceOf(Error)
    },
    () => false
  )

  execIt(
    'should get empty string when returning empty string',
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({ result: '' })
    },
    () => ''
  )

  execIt(
    'should get string when returning string',
    // @ts-ignore
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({ result: 'rval-string' })
    },
    () => 'rval-string'
  )

  execIt(
    'should get empty array when returning empty array',
    // @ts-ignore
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({ result: [] })
    },
    () => ([])
  )

  execIt(
    'should get array when returning array',
    // @ts-ignore
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({ result: ['rval-string'] })
    },
    () => (['rval-string'])
  )

  execIt(
    'should get empty object when returning empty object',
    // @ts-ignore
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({})
    },
    () => ({})
  )

  execIt(
    'should get object when returning object',
    // @ts-ignore
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({ an: 'object' })
    },
    () => ({ an: 'object' })
  )

  execIt(
    'should get non-plain-object under result',
    // @ts-ignore
    ({ result, error }: CheckerFnArgs) => {
      expect(error).to.be.undefined
      expect(result).to.deep.eq({ result: new Dummy() })
    },
    () => new Dummy()
  )

  execIt(
    'should handle thrown exception',
    ({ result, error }: CheckerFnArgs) => {
      expect(result).to.be.undefined
      expect(error).to.be.instanceOf(Error)
      if (error !== undefined) {
        expect(error.message).to.be.eq('err')
      }
    },
    () => { throw new Error('err') }
  )

  execIt(
    'should handle rejection',
    ({ result, error }: CheckerFnArgs) => {
      expect(result).to.be.undefined
      expect(error).to.be.eq('err')
    },
    // eslint-disable-next-line prefer-promise-reject-errors
    async () => { return Promise.reject('err') }
  )

  execIt(
    'should handle promise',
    ({ result, error }: CheckerFnArgs) => {
      // @ts-ignore
      expect(result.result).to.be.eq('ok')
      expect(error).to.be.undefined
    },
    async () => { return Promise.resolve('ok') }
  )
})

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { Service } from './service'
import { IScriptFn, ScriptSecurity } from './d'

const serviceConfig = {
  cServers: {
    system: { apiBaseURL: 'unit-test' },
    compose: { apiBaseURL: 'unit-test' },
    messaging: { apiBaseURL: 'unit-test' }
  }
}

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
        { label: 'label1', name: 'Name', description: 'deskription', resource: 'res1', errors: [], security: ScriptSecurity.definer, events: [] },
        { label: 'label2', name: 'Name', description: 'deskription', resource: 'res2', errors: [], security: ScriptSecurity.invoker, events: ['beforeMyThing', 'afterMyThing'] },
        { label: 'label3', name: 'Name', description: 'deskription', resource: 'res2', errors: [], security: ScriptSecurity.invoker, events: ['afterMyThing'] }
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

    it('should match all by resource with query', () => {
      expect(svc.List({ query: 'res' })).to.have.lengthOf(3)
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

    it('should match all with security=definer', () => {
      expect(svc.List({ security: ScriptSecurity.definer })).to.have.lengthOf(1)
    })
  })
})

interface checkerFnArgs {
    result?: any;
    logs?: string[];
    error?: Error;
}

interface checkerFn {
    (_: checkerFnArgs): void;
}

describe('execution', () => {
  const execIt = (name: string, check: checkerFn, fn: IScriptFn, args: any = {}) => {
    it(name, async () => {
      // Script maker
      const svc = new Service(serviceConfig)
      svc.Update([{
        name,
        errors: [],
        security: ScriptSecurity.definer,
        events: [],
        fn
      }])

      svc.Exec(name, args)
        .then(check)
        .catch((error: any) => check({ error })
        )
    })
  }

  execIt(
    'empty',
    () => {},
    () => {}
  )

  execIt(
    'should get true',
    ({ result }: checkerFnArgs) => { expect(result.result).to.be.true },
    () => true
  )

  execIt(
    'should get false',
    ({ result }: checkerFnArgs) => { expect(result.result).to.be.false },
    () => false
  )

  execIt(
    'should get empty string',
    ({ result }: checkerFnArgs) => { expect(result.result).to.equal('') },
    () => ''
  )

  execIt(
    'should get empty string',
    ({ result }: checkerFnArgs) => { expect(result.result).to.equal('') },
    () => ''
  )

  execIt(
    'should handle thrown exception',
    ({ result, error }: checkerFnArgs) => {
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
    ({ result, error }: checkerFnArgs) => {
      expect(result).to.be.undefined
      expect(error).to.be.eq('err')
    },
    async () => { return Promise.reject('err') }
  )

  execIt(
    'should handle promise',
    ({ result, error }: checkerFnArgs) => {
      expect(result.result).to.be.eq('ok')
      expect(error).to.be.undefined
    },
    async () => { return Promise.resolve('ok') }
  )
})

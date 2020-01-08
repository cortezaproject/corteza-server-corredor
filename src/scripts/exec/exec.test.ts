/* eslint-disable no-unused-expressions,@typescript-eslint/no-empty-function,@typescript-eslint/ban-ts-ignore */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { ArgsRaw, Exec, ScriptExecFn } from './exec'
import { LogToArray } from '../log-to-array'

// @ts-ignore
import pino from 'pino'
import { BaseArgs } from './args'

interface CheckerFnArgs {
    result?: {[_: string]: unknown}|unknown;
    logs?: string[];
    error?: Error;
}

interface CheckerFn {
    (_: CheckerFnArgs): void;
}

class Dummy {}

describe('execution', () => {
  const execIt = (name: string, check: CheckerFn, exec: ScriptExecFn, args?: BaseArgs): void => {
    it(name, async () => {
      const logBuffer = new LogToArray()
      const scriptLogger = pino({}, logBuffer)

      Exec(exec, args, scriptLogger)
        .then(result => check({ result }))
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

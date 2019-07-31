import chai, {expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import executor from '../../../../src/grpc-server/services/script-runner/executor'
import {VMScript} from 'vm2'
import context from '../../../../src/grpc-server/services/script-runner/context'
import Record from '../../../../src/types/record'
import Module from '../../../../src/types/module'

chai.use(chaiAsPromised)

const makeVMScript = (source) => {
  return (new VMScript(source, 'test-dummy.js'))
}

describe('executor.js', () => {
  let ctx

  beforeEach(() => {
    sinon.restore()
  })

  describe('simple operations', () => {
    ctx = { $record: new Record(new Module()) }

    it('void/undefined return', async () => {
      expect(await executor(makeVMScript('return'))).is.undefined
    })

    it('falsy return', async () => {
      expect(await executor(makeVMScript('return false'))).is.false
    })

    it('true w/o context', async () => {
      expect(await executor(makeVMScript('return true'))).is.undefined
    })

    it('void w/ context', async () => {
      expect(await executor(makeVMScript(''), ctx)).is.instanceof(Record)
    })

    it('true w/ context', async () => {
      expect(await executor(makeVMScript('return true'), ctx)).is.instanceof(Record)
    })

    it('rejection with returned promise', () => {
      expect(executor(makeVMScript('return new Promise((resolve,reject) => { reject("niet")})'))).to.be.rejectedWith("niet")
    })

    it.skip('rejection w/o returned promise', () => {
      // @todo skip for now, raises UnhandledPromiseRejectionWarning:
      expect(executor(makeVMScript('new Promise((resolve,reject) => { reject("niet")})'))).to.be.rejectedWith("niet")
    })

    it('throw', () => {
      expect(executor(makeVMScript('throw Error("simple")'))).to.be.rejectedWith(Error, "simple")
    })
  })

  describe('data manipulation', () => {
    beforeEach(() => {
      ctx = context({
        namespace: {},
        module: { fields: [{ name: 'foo'}, { name: 'bar'}]},
        record: { values: [{ name: 'foo', value: 1 }, { name: 'bar', value: 1 }]},
      })
    })

    it('simple code, no returning value, results should be picked from context/sandbox', async () => {
      let r = await executor(makeVMScript('$record.values.foo = 2'), ctx)
      expect(r).is.not.undefined
      expect(r.values.foo).to.equal(2)
      expect(r.values.bar).to.equal(1)
    })

    it('async wrap, no returning value, results should be picked from context/sandbox', async () => {
      let r = await executor(makeVMScript('(async () => {$record.values.foo = 3})()'), ctx)
      expect(r).is.not.undefined
      expect(r.values.foo).to.equal(3)
      expect(r.values.bar).to.equal(1)
    })

    it('explicitly returning record', async () => {
      let r = await executor(makeVMScript('r = new Record($module); r.values.foo = 4; r.values.bar = 1; return r'), ctx)
      expect(r).is.not.undefined
      expect(r.values.bar).to.equal(1)
      expect(r.values.foo).to.equal(4)
    })

    it.skip('resolving value through promise', async () => {
      // @todo skipped for now
      let r = await executor(makeVMScript('return new Promise((resolve) => {r = new Record($module); r.values.foo = 5; return resolve(r)})'), ctx)
      expect(r).is.not.undefined
      expect(r.values.foo).to.equal(5)
      expect(r.values.bar).to.equal(1)
    })

    it('rejecting a promise', async () => {
      let r = await executor(makeVMScript('return new Promise((resolve, reject) => {reject()})'), ctx)
      expect(r).is.false
    })
  })

  describe('exotic', () => {
    it('async call', () => {
      ctx = context({
        namespace: {},
        module: { fields: [{ name: 'foo'}, { name: 'bar'}]},
        record: { values: [{ name: 'foo', value: 1 },{ name: 'bar', value: 1 }]},
      })

      executor(makeVMScript('$record.values.foo = 2'), {}, { async: true })
    })
  })
})

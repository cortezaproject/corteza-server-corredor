import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
  default as h,
  extractID,
  extractIDsFromModule,
  findValidModule,
} from '../../../../src/grpc-server/services/script-runner/helpers'
import Module from '../../../../src/types/module'
import Record from '../../../../src/types/record'
import ModuleField from '../../../../src/types/module_field'
import sinon from 'sinon'

describe('helpers.js', () => {
  beforeEach(() => {
    sinon.restore()
  })

  describe('supporting functions', () => {
    describe('extractID', () => {
      it('should extract the ID', () => {
        const k = 'testKey'
        expect(extractID(4200001)).to.equal('4200001')
        expect(extractID('4200002')).to.equal('4200002')
        expect(extractID({testKey: '4200003'}, k)).to.equal('4200003')
      })

      it('should throw error on invalid input', () => {
        expect(() => extractID('abc')).to.throw()
        expect(() => extractID([])).to.throw()
        expect(() => extractID({})).to.throw()
        expect(() => extractID()).to.throw()
      })
    })

    describe('findValidModule', () => {
      it('should first valid module', () => {
        const m = new Module({moduleID: '1',namespaceID: '2'})
        expect(findValidModule(undefined, null, false, 0, '', 'abc', m)).to.deep.equal(m)
      })
    })

    describe('extractIDsFromModule', () => {
      it('should extract IDs from Module', () => {
        expect(extractIDsFromModule(new Module({moduleID: '1',namespaceID: '2'}))).to.deep.equal({moduleID: '1',namespaceID: '2'})
      })

      it('should extract IDs from Object', () => {
        expect(extractIDsFromModule({moduleID: '1',namespaceID: '2'})).to.deep.equal({moduleID: '1',namespaceID: '2'})
      })

      it('should throw error on invalid input', () => {
        expect(() => extractIDsFromModule()).to.throw()
      })
    })
  })

  describe('helpers', () => {
    const $module = new Module({
      moduleID: '1',
      namespaceID: '2',
      fields: [
        new ModuleField({name: 'str', kind: 'String'}),
        new ModuleField({name: 'num', kind: 'Number'}),
        new ModuleField({name: 'multi', kind: 'String', isMulti: true }),
      ],
    })

    describe('MakeRecord', () => {
      it('should make a record', () => {
        expect(h().MakeRecord({}, $module)).to.instanceof(Record)
        expect(h().MakeRecord({str:"foo"}, $module).values.str).to.equal('foo')
      })
    })

    describe('SaveRecord', () => {
      it('should save new record')
      it('should update existing record')
      it('should throw when updating $record')
      it('should throw when creating $record')
      it('should allow to update $record when forced')
      it('should allow to create $record when forced')
    })

    describe('DeleteRecord', () => {
      it('should throw when input is not a record')
      it('should delete record')
      it('should throw when deleting $record')
      it('should allow to delete $record when forced')
    })

    describe('FindRecords', () => {
      it('should find records on $module')
      it('should find records on a different module')
      it('should properly translate filter to ID when numeric')
      it('should properly translate filter to query when string')
      it('should cast retrieved objects to Record')
    })

    describe('FindRecordByID', () => {
      it('should find record on $module')
      it('should find record on a different module')
      it('should find by ID when given a Record object')
      it('should cast retrieved objects to Record')
    })

    describe('FindModules', () => {
      it('should find modules on $namespace')
      it('should find modules on a different namespace')
      it('should properly translate filter to query when string')
      it('should cast retrieved objects to Module')
    })

    describe('FindModuleByID', () => {
      it('should find module on $module')
      it('should find by ID when given a Module object')
      it('should cast retrieved objects to Module')
    })

    describe('FindUsers', () => {
      it('should find users on $namespace')
      it('should find users on a different namespace')
      it('should properly translate filter to query when string')
      it('should cast retrieved objects to User')
    })

    describe('FindUserByID', () => {
      it('should find user on $module')
      it('should find by ID when given a User object')
      it('should cast retrieved objects to User')
    })

    describe('SendEmail', () => {
      it('should write some tests')
    })

    describe('SendMessageToChannel', () => {
      it('should write some tests')
    })

    describe('SendDirectMessageToUser', () => {
      it('should write some tests')
    })
  })
})

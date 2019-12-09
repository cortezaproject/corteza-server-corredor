import {describe, it} from 'mocha'
import {expect} from 'chai'
import {Service} from "./service";
import {ScriptSecurity} from "./d";

describe('scripts list', () => {
    it('empty list', () => {
        const svc = new Service()
        expect(svc.List()).to.have.lengthOf(0)
    })

    const svc = new Service()
    svc.Update([
        { label: 'label1', name: 'Name', description: 'deskription', resource: 'res1', errors: [], security: ScriptSecurity.definer, events: []},
        { label: 'label2', name: 'Name', description: 'deskription', resource: 'res2', errors: [], security: ScriptSecurity.invoker, events: [ 'beforeMyThing', 'afterMyThing' ]},
        { label: 'label3', name: 'Name', description: 'deskription', resource: 'res2', errors: [], security: ScriptSecurity.invoker, events: [ 'afterMyThing' ]},
    ])

    it('should match all 3 with "abel"', () => {
        expect(svc.List({ query: 'abel' })).to.have.lengthOf(3)
    });

    it('should match 1 with labe1', () => {
        expect(svc.List({ query: 'label1' })).to.have.lengthOf(1)
    });

    it('should match all 3 with description', () => {
        expect(svc.List({ query: 'deskr' })).to.have.lengthOf(3)
    });

    it('should match all by resource with query', () => {
        expect(svc.List({ query: 'res' })).to.have.lengthOf(3)
    });

    it('should match 2 with res2 for resource', () => {
        expect(svc.List({ resource: 'res2' })).to.have.lengthOf(2)
    });

    it('should match none with re for resource', () => {
        expect(svc.List({ resource: 're' })).to.have.lengthOf(0)
    });

    it('should match 2 with events', () => {
        expect(svc.List({ events: ['afterMyThing'] })).to.have.lengthOf(2)
    });

    it('should match 1 with event', () => {
        expect(svc.List({ events: ['beforeMyThing'] })).to.have.lengthOf(1)
    });

    it('should match all with no events', () => {
        expect(svc.List({ events: [] })).to.have.lengthOf(3)
    })

    it('should match all with security=definer', () => {
        expect(svc.List({ security: ScriptSecurity.definer })).to.have.lengthOf(1)
    })
})


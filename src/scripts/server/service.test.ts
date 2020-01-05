/* eslint-disable no-unused-expressions,@typescript-eslint/no-empty-function,@typescript-eslint/ban-ts-ignore */

import { describe, it } from 'mocha'
import { expect } from 'chai'
import { Service } from '.'
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
            new Trigger({ events: ['foo'], resources: ['res1'], constraints: [] })
          ]
        },
        {
          label: 'label2',
          name: 'Name',
          description: 'deskription',
          errors: [],
          triggers: [
            new Trigger({ events: ['afterMyThing'], resources: ['res2'], constraints: [] })
          ]
        },
        {
          label: 'label3',
          name: 'Name',
          description: 'deskription',
          errors: [],
          triggers: [
            new Trigger({ events: ['beforeMyThing', 'afterMyThing'], resources: ['res2'], constraints: [] })
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

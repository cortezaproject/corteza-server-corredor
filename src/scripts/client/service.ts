import { Script, ScriptType } from './'
import { corredor as exec } from '@cortezaproject/corteza-js'

export interface ListFilter {
    query?: string;
    resource?: string;
    events?: string[];
    bundle?: string;
    type?: string;
}

export interface ListFiterFn {
    (item: Script): boolean;
}

function match (f: ListFilter): ListFiterFn {
  return (item: Script): boolean => {
    if (f === undefined) {
      // Match all when no filter
      return true
    }

    if (!!f.bundle && f.bundle !== item.bundle) {
      // Filter by bundle, expecting exact match
      return false
    }

    if (!!f.type && f.type !== item.type) {
      // Filter by type, expecting exact match
      return false
    }

    if (!!f.resource && f.resource !== item.resourceType) {
      // Filter by resource, expecting exact match
      return false
    }

    if (!!f.events && f.events.length > 0) {
      // item has less events than filter,
      // no way this can be a match.
      if (item.eventTypes.length < f.events.length) {
        return false
      }

      // Filter by events, should contain all filtered events
      for (const e of f.events) {
        if (!item.eventTypes.includes(e)) {
          return false
        }
      }
    }

    if (f.query) {
      // Strings to search through
      const str = `${item.name} ${item.label} ${item.description} ${item.resourceType} ${item.eventTypes.join(' ')}`

      // search query terms
      for (const t of f.query.split(' ')) {
        if (str.indexOf(t) > -1) {
          return true
        }
      }

      // none matched, fail
      return false
    }

    // No match
    return true
  }
}

/**
 *
 */
export class Service {
  private scripts: Script[] = []
  public readonly config: Record<string, any>

  /**
     * Service constructor
     */
  constructor (config: Record<string, any>) {
    this.config = config
  }

  /**
   * Loads scripts
   *
   * @return {void}
   */
  Update (set: Script[]): void {
    // Scripts loaded, replace set
    this.scripts = set
  }

  /**
   * Returns list of scripts
   */
  List (f: ListFilter = {}): Script[] {
    return this.scripts.filter(match(f))
  }
}

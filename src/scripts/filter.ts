import { Script } from './types'

interface ListFilter {
    query?: string;
    resource?: string;
    events?: string[];
}

interface TriggerFilterArgs {
  resources: string[];
  events: string[];
}

/**
 * Creates Array.filter() compatible function for filtering script array
 */
export default function (f: ListFilter): {(Script): boolean} {
  return (item: Script): boolean => {
    if (f === undefined) {
      // Match all when no filter
      return true
    }

    if (f.resource || f.events) {
      const tt = (item.triggers || []).filter(({ resources, events }: TriggerFilterArgs) => {
        if (f.resource && f.resource.length > 0) {
          // Filter by resource
          if (!resources || resources.indexOf(f.resource) === -1) {
            // No resources found on trigger
            return false
          }
        }

        if (f.events && f.events.length > 0) {
          // Filter by events
          if (!events || f.events.find(fe => (events.indexOf(fe) > -1)) === undefined) {
            return false
          }
        }

        return true
      })

      if (tt.length === 0) {
        // Filtering by resource and/or events but
        // none of the triggers matched
        return false
      }
    }

    if (f.query) {
      // Strings to search through
      const str = `${item.name} ${item.label} ${item.description}`

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

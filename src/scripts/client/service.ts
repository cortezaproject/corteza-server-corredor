import { Script } from '../shared'
import MakeFilterFn from '../filter'

interface ListFilter {
    query?: string;
    resourceType?: string;
    eventTypes?: string[];
    bundle?: string;
    type?: string;
}

/**
 *
 */
export class Service {
  private scripts: Script[] = []

  /**
   * Service constructor
   */
  constructor () {
    // void
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
    return this.scripts.filter(MakeFilterFn(f))
  }
}

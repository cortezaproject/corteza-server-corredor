import { GetLastUpdated, Script } from '../shared'
import MakeFilterFn from '../filter'
import fs from 'fs'
import path from 'path'

interface ListFilter {
    query?: string;
    resourceType?: string;
    eventTypes?: string[];
    bundle?: string;
    type?: string;
}

interface Config {
  bundleOutputPath: string;
}

/**
 *
 */
export class Service {
  private scripts: Script[] = []
  private readonly config: Config

  /**
   * Service constructor
   */
  constructor (config: Config) {
    this.config = config
  }

  // Returns date of the most recently updated script from the set
  get lastUpdated (): Date {
    return GetLastUpdated(this.scripts)
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

  Bundle (name: string): Buffer {
    return fs.readFileSync(path.join(this.config.bundleOutputPath, name + '.js'))
  }

  /**
   * Returns list of scripts
   */
  List (f: ListFilter = {}): Script[] {
    return this.scripts.filter(MakeFilterFn(f))
  }
}

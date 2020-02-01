import { Script, ScriptType } from './bundlebuilderscript2'

class BundleBuilderScript {
    public filename = ''
    public slug = ''
    public instance: any = null

    constructor (filename = '', slug = '') {
      this.filename = filename
      this.slug = slug
    }

    getSlug (): string {
      return this.slug === ''
        ? this.filename.substring(this.filename.lastIndexOf('/') + 1, this.filename.lastIndexOf('.'))
        : this.slug
    }

    importFile (): void {
      this.instance = require(this.filename)
    }

    getImports (): string[] {
      if (this.instance === null) {
        this.importFile()
      }

      const temp: string[] = []

      Object.keys(this.instance).forEach((exportName) => {
        temp.push(`${this.getSlug()}::${exportName}`)
      })

      return temp
    }
}

class ScriptExtended implements Script {
  name: string;
  label?: string;
  description?: string;
  resourceType?: string;
  eventTypes: string[];
  bundle: string;
  type: ScriptType;
  security: string[];
  triggers: string[];
  errors: string[];
  instance: any;
  filename: string;

  constructor (name: string, bundle: string, type: ScriptType, security: string[], triggers: string[], errors: string[]) {
    this.name = name
    this.bundle = bundle
    this.type = type
    this.security = security
    this.triggers = triggers
    this.errors = errors

    this.eventTypes = []
    this.instance = null
    this.filename = ''
  }

  static async import (script: Script, filepath: string): Promise<ScriptExtended> {
    const name = script.name
    const bundle = script.bundle
    const type = script.type
    const security: string[] = []
    const triggers = script.triggers
    const errors = script.errors

    const se = new ScriptExtended(name, bundle, type, security, triggers, errors)

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    se.instance = await require(filepath)
    se.filename = filepath

    return se
  }

  getSlug () {
    return this.name.replace('/', '_')
  }

  // importFile (): void {
  //   this.instance = require(this.filename)
  // }

  getImports (): string[] {
    // if (this.instance === null) {
    //   this.importFile()
    // }

    const temp: string[] = []

    Object.keys(this.instance).forEach((exportName) => {
      temp.push(`${this.getSlug()}::${exportName}`)
    })

    return temp
  }
}

export {
  ScriptExtended,
  BundleBuilderScript,
}

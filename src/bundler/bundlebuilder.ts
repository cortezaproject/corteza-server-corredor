import { BundleBuilderScript, ScriptExtended } from './bundlebuilderscript'
import webpack from 'webpack'

class BundleBuilder {
    public scripts: Record<string, any> = {}
    public modules: Record<string, any> = {}
    public bundle = ''
    public bundles: string[] = [];
    public stream: any = null
    public ss: Map<string, ScriptExtended>

    constructor (bundle = 'default') {
      this.bundle = bundle

      this.scripts[this.bundle] = []
      this.modules[this.bundle] = {}

      this.ss = new Map()
    }

    addBundle (bundle: string): this {
      if (this.bundles.indexOf(bundle) === -1) {
        this.bundles.push(bundle)
        this.modules[bundle] = []
      }

      return this
    }

    getBundles (): string[] {
      return this.bundles
    }

    setBundle (bundle: string): this {
      this.bundle = bundle

      if (!this.scripts[this.bundle]) {
        this.scripts[this.bundle] = []
      }

      if (!this.modules[this.bundle]) {
        this.modules[this.bundle] = []
      }

      return this
    }

    setStream (stream: NodeJS.WritableStream): this {
      this.stream = stream

      return this
    }

    registerFile (filename: string) {
      // const instance = require(filename)
      this.registerScript(new BundleBuilderScript(filename))
    }

    registerScript (script: BundleBuilderScript) {
      this.scripts[this.bundle].push(script)
    }

    async registerScript2 (script: any, filepath: string, bundle: string): Promise<void> {
      const instantiatedScript = await ScriptExtended.import(script, filepath)
      instantiatedScript.bundle = bundle
      this.ss.set(instantiatedScript.name, instantiatedScript)
    }

    getScripts (bundle: string): ScriptExtended[] {
      // console.log('GETSCRIPTS', this.ss.values())
      return [...this.ss.values()]
        .filter((script: ScriptExtended) => {
          return script.bundle === bundle
        })
    }

    getModules (bundle: string) {
      return this.modules[bundle]
    }

    generateImports (bundle: string) {
      console.log('BUNDL', bundle)
      this.getScripts(bundle)
        .forEach((script: ScriptExtended) => {
          console.log('NEJM', script.name)
          this.modules[bundle][script.getSlug()] = script.getImports()
        })

      console.log(this.modules)

      // this.getScripts().forEach((s) => {
      //   // add to this.modules[s.getName()]
      //   this.modules[this.bundle][s.getSlug()] = s.getImports()
      // })
    }

    buildAllImportLines (bundle: string) {
      const lines: string[] = []

      // console.log('HERE SCRIPTS', this.getScripts(bundle))
      this.getScripts(bundle).forEach((s) => {
        // console.log('HERE SCRIPT', s.name)
        lines.push(this.buildImportLine(bundle, s))
      })

      console.log('LINES', lines)

      return lines
    }

    buildImportLine (bundle: string, script: ScriptExtended): string {
      const importLineModules = this.buildImportLineModules(bundle, script)
      const scriptFilename = script.filename

      return `import ${importLineModules} from '${scriptFilename}'`
    }

    buildImportLineModules (bundle: string, script: ScriptExtended): string {
      const mods: string[] = []
      const slug = script.getSlug()

      this.getModules(bundle)[slug].forEach((m: any) => {
        const [_, mod] = m.split('::')
        const modSlug = this.buildModuleSlugFromKey(mod, slug)

        mods.push(mod === 'default' ? `default as ${modSlug}` : modSlug)
      })

      return `{ ${mods.join(',')} }`
    }

    buildModuleSlugFromKey (mod: string, scriptSlug: string): string {
      return mod === 'default' ? `${scriptSlug}Default` : mod
    }

    buildExportStructure (bundle: string) {
      const st: { [index: string]: string } = {}
      const modules = this.getModules(bundle)

      Object.keys(modules).forEach((scriptSlug) => {
        modules[scriptSlug].forEach((el: string) => {
          const [_, mod] = el.split('::')
          const modSlug = this.buildModuleSlugFromKey(mod, scriptSlug)

          st[el] = modSlug
        })
      })

      return st
    }

    dumpToStream (bundle: string) {
      const importLines = this.buildAllImportLines(bundle).join('\n')
      const exportStructure = `export const ${bundle} = ${this.exportStructureToString(this.buildExportStructure(bundle))}`
      const output = `${importLines}\n${exportStructure}`

      if (this.stream === undefined) {
        this.stream = process.stdout
      }

      this.stream.write(output)
    }

    exportStructureToString (struct: any): string {
      let str = ''

      Object.keys(struct).forEach((k) => {
        str += `"${k}": ${struct[k]},`
      })

      str = str.replace(/,+$/, '')

      return `{${str}}`
    }

    buildWithBundler (bundle: string, input: string, output: string): void {
      webpack({
        entry: input,
        output: {
          path: output,
          filename: `${bundle}.bundle.js`,
          libraryTarget: 'this',
          library: 'ClientScripts',
        },
        mode: 'development',
      }
      , (err, stats) => { // Stats Object
        process.stdout.write(stats.toString() + '\n')

        if (err && err.message) {
          process.stderr.write(err.message)
        }
      })
    }
}

export {
  BundleBuilder,
  BundleBuilderScript,
}

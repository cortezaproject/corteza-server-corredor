import * as ts from 'typescript'
import vm from 'vm'
import { Script, ScriptSecurity } from '../types'
import MakeTrigger from './trigger'

interface RawScriptSecurity {
  runAs?: string;
  allow: string|string[];
  deny: string|string[];
}

export default class ScriptParser {
  source: ts.SourceFile

  constructor (source: Buffer | string, { src = 'buffer', languageVersion = ts.ScriptTarget.Latest } = {}) {
    this.source = ts.createSourceFile(
      src,
      source.toString(),
      languageVersion,
    )
  }

  async parse (): Promise<Partial<Script>> {
    // const walk = (n: ts.Node, l = 0) => {
    //   console.log(' '.repeat(l), ts.SyntaxKind[n.kind])
    //   n.forEachChild(n => walk(n, l + 1))
    // }
    // this.source.forEachChild(n => walk(n, 0))
    return this.findDefaultExport(this.source)
      .then(n => this.parseDefaultExport(n))
      .then(def => this.parseExportedObject(def))
  }

  /**
   * Parses first level of AST
   *
   * Tries to find 'export default { ... }'
   *
   * @param n
   */
  protected findDefaultExport (n: ts.Node): Promise<ts.Node> {
    return new Promise((resolve, reject) => {
      n.forEachChild(n => {
        if (ts.isExportAssignment(n)) {
          n.forEachChild(o => {
            if (ts.isObjectLiteralExpression(o)) {
              resolve(n)
            }
          })

          reject(new SyntaxError('expecting object as default export'))
        }
      })

      reject(new SyntaxError('expecting default export'))
    })
  }

  protected parseDefaultExport (n: ts.Node): {[_: string]: unknown} {
    const source = n.getText(this.source)

    const tm = ts.transpileModule(source, {
      compilerOptions: {
        allowJs: true,
        checkJs: true,
        allowSyntheticDefaultImports: true,
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.CommonJS,
      },
    })

    // eslint-disable-next-line no-eval
    const snippet = `var exports = {};${tm.outputText}`
    const def = new vm.Script(snippet).runInNewContext({})
    if (typeof def !== 'object') {
      throw new SyntaxError('expecting object as default export')
    }

    return def
  }

  protected parseExportedObject (o: {[_: string]: unknown}): Partial<Script> {
    const s: Partial<Script> = {}

    if (Object.prototype.hasOwnProperty.call(o, 'label') && typeof o.label === 'string') {
      s.label = o.label
    }

    if (Object.prototype.hasOwnProperty.call(o, 'description') && typeof o.description === 'string') {
      s.description = o.description
    }

    if (Object.prototype.hasOwnProperty.call(o, 'triggers')) {
      s.triggers = MakeTrigger(o.triggers) ?? []
    } else {
      throw new SyntaxError('triggers definition missing')
    }

    if (!s.triggers || s.triggers.length === 0) {
      throw new SyntaxError('no triggers defined')
    }

    if (!Object.prototype.hasOwnProperty.call(o, 'exec')) {
      throw new SyntaxError('exec function missing')
    } else if (typeof o.exec !== 'function') {
      throw new SyntaxError('exec is not a function')
    }

    if (Object.prototype.hasOwnProperty.call(o, 'security')) {
      s.security = this.parseSecurity(o.security as RawScriptSecurity)
    }

    // Merge resolved & the rest
    return s
  }

  protected parseSecurity (sec: unknown): ScriptSecurity|null {
    if (typeof sec === 'undefined') {
      return null
    }

    if (typeof sec === 'string') {
      return { runAs: sec, deny: [], allow: [] }
    }

    if (typeof sec === 'object') {
      const { allow, deny, runAs } = sec as RawScriptSecurity

      if (!allow && !deny && !runAs) {
        return null
      }

      const out: ScriptSecurity = { runAs, allow: [], deny: [] }

      if (allow) {
        out.allow = Array.isArray(allow) ? allow : [allow]
      }

      if (deny) {
        out.deny = Array.isArray(deny) ? deny : [deny]
      }

      return out
    }

    throw new SyntaxError('unknown security definition format')
  }
}

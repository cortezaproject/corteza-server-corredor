import { corredor as exec } from '@cortezaproject/corteza-js'

export interface ScriptSecurity {
  runAs?: string;
  deny: string[];
  allow: string[];
}

export interface ScriptFn {
  (args: exec.Args, ctx?: exec.Ctx): unknown;
}

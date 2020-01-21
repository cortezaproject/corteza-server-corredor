import { Trigger } from './trigger'
import { corredor as exec } from '@cortezaproject/corteza-js'

export interface ScriptFn {
    (args: exec.Args, ctx?: exec.Ctx): unknown;
}

export interface ScriptSecurity {
    runAs?: string;
    deny: string[];
    allow: string[];
}

export interface Script {
    filepath: string;
    name: string;
    label?: string;
    description?: string;
    security?: ScriptSecurity;
    triggers?: Trigger[];
    exec?: ScriptFn;
    errors?: string[];
}

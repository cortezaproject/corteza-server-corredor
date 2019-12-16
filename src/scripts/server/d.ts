import {ExecContext} from "./exec-context";
import {ExecArgs} from "./exec-args";

export interface IExecConfigCServers {
    system:    IExecConfigServer,
    compose:   IExecConfigServer,
    messaging: IExecConfigServer,
}

export interface IExecConfigServer {
    apiBaseURL: string,
}

export interface IExecConfig {
    cServers:  IExecConfigCServers,
    [_: string]: any,
}

export interface IExecResponse {
    result: object
    log: string[]
}

export enum EventType {
    info = 'INFO',
    debug = 'DEBUG',
    error = 'ERROR',
    warn = 'WARN',
}

export interface Event {
    timestamp: Date
    type: EventType
    message: string
}

export interface IWatchCallback {
    (): void
}

export const ScriptExtValidator = /\.(ts|js)$/;
export const DocBlockExtractor = /(\/\*\*.+?\*\/)/s;

export enum ScriptSecurity {
    invoker = 'invoker',
    definer = 'definer',
}

export interface IScriptFn{
    (args: ExecArgs, ctx: ExecContext): any
}

export interface IScript {
    name:         string;
    label?:       string;
    description?: string;
    resource?:    string;
    events:       string[];
    security:     ScriptSecurity;
    fn?:          IScriptFn;
    errors:       string[];
}


export interface IDocBlock {
    label:       string;
    description: string;
    resource:    string|undefined;
    events:      string[];
    security:    ScriptSecurity;
}

export interface gRPCServiceExecResponse {
    result: object
}

export interface gRPCServiceListResponse {
    scripts: IScript[]
}

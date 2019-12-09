import {Logger} from "./logger";

export interface IExecResponse {
    result: object
    log: string[]
}

export interface IExecContext {
    log: Logger
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
    (args: object, ctx: IExecContext): object
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

import { ExecArgs, ExecContext } from '.'

export interface ExecConfigCServers {
    system: ExecConfigServer;
    compose: ExecConfigServer;
    messaging: ExecConfigServer;
}

export interface ExecConfigServer {
    apiBaseURL?: string;
}

export interface ExecConfig {
    cServers: ExecConfigCServers;
    [_: string]: unknown;
}

export interface ExecResponse {
    result: object;
    log: string[];
}

export interface ExecArgsRaw {
    jwt?: string;
    [_: string]: unknown;
}

export enum EventType {
    info = 'INFO',
    debug = 'DEBUG',
    error = 'ERROR',
    warn = 'WARN',
}

export interface Event {
    timestamp: Date;
    type: EventType;
    message: string;
}

export interface WatchFn {
    (): void;
}

export const ScriptExtValidator = /\.(ts|js)$/
export const DocBlockExtractor = /(\/\*\*.+?\*\/)/s

export enum ScriptSecurity {
    invoker = 'invoker',
    definer = 'definer',
}

export interface ScriptFn {
    (args: ExecArgs, ctx: ExecContext): unknown;
}

export interface Script {
    name: string;
    label?: string;
    description?: string;
    resource?: string;
    events: string[];
    security: ScriptSecurity;
    fn?: ScriptFn;
    errors: string[];
}

export interface DocBlock {
    label: string;
    description: string;
    resource: string|undefined;
    events: string[];
    security: ScriptSecurity;
}

export interface GRPCServiceExecResponse {
    result: object;
}

export interface GRPCServiceListResponse {
    scripts: Script[];
}

import { ExecArgs, ExecContext } from '.'
import { Trigger } from '../trigger'

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

export interface ScriptFn {
    (args: ExecArgs, ctx: ExecContext): unknown;
}

export interface Script {
    name: string;
    label?: string;
    description?: string;
    triggers: Trigger[];
    fn?: ScriptFn;
    errors: string[];
}

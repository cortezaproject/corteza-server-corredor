import { ScriptSecurity } from '../shared'

export enum ScriptType {
    function = 'function',
    component = 'component',
    style = 'style',
}

export interface Script {
    name: string;
    label?: string;
    description?: string;
    resourceType?: string;
    eventTypes: string[];
    bundle: string;
    type: ScriptType;
    errors: string[];
    triggers?: string[];
}

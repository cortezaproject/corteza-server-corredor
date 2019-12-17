export enum ScriptType {
    function = 'function',
    component = 'component',
    style = 'style',
}

export interface Script {
    name: string;
    label?: string;
    description?: string;
    resource?: string;
    events: string[];
    bundle: string;
    type: ScriptType;
    errors: string[];
}

export interface Script {
    name: string;
    label?: string;
    description?: string;
    resource?: string;
    events: string[];
    errors: string[];
}

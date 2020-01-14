import { Trigger } from './trigger'
import { corredor as exec } from 'corteza-js'

export declare interface ScriptFn {
    (args: exec.Args, ctx?: exec.Ctx): unknown;
}

export declare interface Script {
    name: string;
    label?: string;
    description?: string;
    triggers?: Trigger[];
    exec?: ScriptFn;
    errors?: string[];
}

/**
 * FluentTrigger* declarations provide logical and valid path for trigger construction
 */
export declare class FluentTrigger {
  on (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  before (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  after (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  at (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  every (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
}

/**
 * FluentTrigger* declarations provide logical and valid path for trigger construction
 */
declare class FluentTriggerResource {
  for (...resources: string[]): FluentTriggerConstraints & FluentTriggerRunAs
}

/**
 * FluentTrigger* declarations provide logical and valid path for trigger construction
 */
declare class FluentTriggerRunAs {
  as (identifier: string): FluentTriggerConstraints
}

/**
 * FluentTrigger* declarations provide logical and valid path for trigger construction
 */
declare interface FluentTriggerConstraints {
  where (name: string, operator: string, ...values: string[]): FluentTriggerConstraints;
  where (name: string, operator: string, values: string[]): FluentTriggerConstraints;
  where (name: string, operator: string, value: string): FluentTriggerConstraints;
  where (name: string, values: string[]): FluentTriggerConstraints;
  where (name: string, value: string): FluentTriggerConstraints;
  where (values: string[]): FluentTriggerConstraints;
  where (value: string): FluentTriggerConstraints;
}

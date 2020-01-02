/**
 * FluentTrigger* declaratinos provide logical and valid path for trigger construction
 */

export declare class FluentTrigger {
  on (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  before (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  after (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  at (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
  every (...events: string[]): FluentTriggerResource & FluentTriggerRunAs
}

declare class FluentTriggerResource {
  for (...resources: string[]): FluentTriggerConstraints & FluentTriggerRunAs
}

declare class FluentTriggerRunAs {
  as (identifier: string): FluentTriggerConstraints
}

declare interface FluentTriggerConstraints {
  where (name: string, operator: string, ...values: string[]): FluentTriggerConstraints;
  where (name: string, operator: string, values: string[]): FluentTriggerConstraints;
  where (name: string, operator: string, value: string): FluentTriggerConstraints;
  where (name: string, values: string[]): FluentTriggerConstraints;
  where (name: string, value: string): FluentTriggerConstraints;
  where (values: string[]): FluentTriggerConstraints;
  where (value: string): FluentTriggerConstraints;
}

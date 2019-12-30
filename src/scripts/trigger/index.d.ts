/**
 * Trigger* declaratinos provide logical and valid path for trigger construction
 */

declare class TriggerBase {
  on (...events: string[]): TriggerResource & TriggerRunAs
  before (...events: string[]): TriggerResource & TriggerRunAs
  after (...events: string[]): TriggerResource & TriggerRunAs
  at (...events: string[]): TriggerResource & TriggerRunAs
  every (...events: string[]): TriggerResource & TriggerRunAs
}

declare class TriggerResource {
  for (...resources: string[]): TriggerConstraints & TriggerRunAs
}

declare class TriggerRunAs {
  as (identifier: string): TriggerConstraints
}

declare interface TriggerConstraints {
  where (value: string): TriggerConstraints;
  where (values: string[]): TriggerConstraints;
  where (name: string, value: string): TriggerConstraints;
  where (name: string, values: string[]): TriggerConstraints;
  where (name: string, operator: string, value: string): TriggerConstraints;
  where (name: string, operator: string, values: string[]): TriggerConstraints;
  where (name: string, operator: string, ...values: string[]): TriggerConstraints;
}

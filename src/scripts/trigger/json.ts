import { Trigger } from './'

export function jsonParser (str: string): Trigger {
  return new Trigger(JSON.parse(str))
}

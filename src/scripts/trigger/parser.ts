import { jsonParser, Trigger } from '.'

/**
 * Parses string with trigger definition into internal structure
 *
 */
export function Parse (str: string): Trigger | undefined {
  if (str.trim().substring(0, 1) === '{') {
    return jsonParser(str)
  }
}

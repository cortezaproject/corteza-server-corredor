import { Maker } from './maker'
import { Finder } from './finder'
import { Script } from './types'

export function Reloader (dir: string): Promise<Script[]> {
  return Maker(Finder(dir), dir)
}

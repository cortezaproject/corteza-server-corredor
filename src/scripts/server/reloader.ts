import { Maker } from './maker'
import { Finder as ServerScriptFinder } from './finder'
import { Script } from './d'

export function Reloader (dir: string): Promise<Script[]> {
  return Maker(ServerScriptFinder(dir), dir)
}

import { Script, Maker, Finder } from '.'

export function Reloader (dir: string): Promise<Script[]> {
  return Maker(Finder(dir), dir)
}

import {Maker} from "./maker";
import {Finder as ServerScriptFinder} from "./finder";
import {IScript} from "./d";

export function Reloader (dir : string) : Promise<IScript[]> {
    return Maker(ServerScriptFinder(dir), dir)
}

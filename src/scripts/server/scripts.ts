import {IScript, ScriptExtValidator} from "./d";
import {promises as fs} from "fs";
import path from "path";
import MakeScript from "./maker";


/**
 * Recursively gathers scripts-like files and returns generator
 *
 * @param {string} p path
 * @param {string} base base path
 */
export async function* GetScripts (p : string, base : string = p): AsyncGenerator<IScript> {
    const ee = await fs.readdir(p, { withFileTypes: true });
    for (const e of ee) {
        const fp = path.resolve(p, e.name);
        if (e.isDirectory()) {
            yield* GetScripts(fp, p);
        } else if (ScriptExtValidator.test(e.name)) {
            yield await MakeScript(fp, p)
        }
    }
}

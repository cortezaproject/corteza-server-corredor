import watch from "node-watch";
import {debounce} from "lodash";
import {ScriptExtValidator} from "./script";

interface IWatchCallback {
    (): void
}

const opt = {
    persistent: false,
    recursive: true,
    delay: 200,
    filter: ScriptExtValidator,
};


export default function (path : string, callback : IWatchCallback) {
    const watcher = watch(path, opt, debounce(() => callback(), 500))
    process.on('SIGINT', watcher.close);
}


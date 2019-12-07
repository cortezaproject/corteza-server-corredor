import watch from "node-watch";
import {debounce} from "lodash";
import {IWatchCallback} from "./d";

const opt = {
    persistent: false,
    recursive: false,
    delay: 200,
};

/**
 * Sets up watcher for path
 *
 * @param {string} path
 * @param {IWatchCallback} callback
 */
export default async function (path : string, callback : IWatchCallback) {
    const watcher = watch(path, opt, debounce(() => callback(), 500))
    process.on('SIGINT', watcher.close);
}


import watch from 'node-watch'
import { debounce } from 'lodash'
import { WatchCallback } from '.'

const opt = {
  persistent: false,
  recursive: false,
  delay: 200
}

/**
 * Sets up watcher for path
 *
 * @param {string} path
 * @param {WatchCallback} callback
 */
export function Watcher (path: string, callback: WatchCallback): void {
  const watcher = watch(path, opt, debounce(() => callback(), 500))
  process.on('SIGINT', watcher.close)
}

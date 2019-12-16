import watch from 'node-watch'
import { debounce } from 'lodash'
import { ScriptExtValidator, WatchFn } from './d'

const opt = {
  persistent: false,
  recursive: true,
  delay: 200,
  filter: ScriptExtValidator
}

export function Watcher (path: string, callback: WatchFn): void {
  const watcher = watch(path, opt, debounce(() => callback(), 500))
  process.on('SIGINT', watcher.close)
}

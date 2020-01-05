import watch from 'node-watch'
import { debounce } from 'lodash'

interface WatchFn {
    (): void;
}

const opt = {
  persistent: false,
  recursive: true,
  delay: 200,
  filter: /\.js$/
}

export function Watcher (path: string, callback: WatchFn): void {
  const watcher = watch(path, opt, debounce(() => callback(), 500))
  process.on('SIGINT', watcher.close)
}

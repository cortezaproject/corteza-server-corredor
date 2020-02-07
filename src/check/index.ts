import bundler from './bundler'
import extensions from './extensions'
import execContext from './exec-ctx'

export default function (): void {
  execContext()
  bundler()
  extensions()
}

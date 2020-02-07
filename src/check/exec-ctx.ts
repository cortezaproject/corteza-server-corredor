import logger from '../logger'
import { execContext } from '../config'

export default function (): void {
  const csCtx = execContext.cortezaServers

  const log = logger.child({ name: 'check' })

  log.info('server-scripts service configured')
  log.debug(csCtx.system, 'configuring cServer system API')
  log.debug(csCtx.compose, 'configuring cServer compose API')
  log.debug(csCtx.messaging, 'configuring cServer messaging API')
}

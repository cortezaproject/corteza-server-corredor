import logger from '../logger'
import { execContext } from '../config'
import axios from 'axios'

export default function (): void {
  const csCtx = execContext.cortezaServers
  const feCtx = execContext.frontend

  const log = logger.child({ name: 'check' })


  log.debug(csCtx.system, 'configuring cServer system API')
  log.debug(csCtx.compose, 'configuring cServer compose API')
  log.debug(csCtx.messaging, 'configuring cServer messaging API')

  const versionEndpoint = csCtx.system.apiBaseURL
    .replace('api/system', 'version')
    .replace('system', 'version')

  axios
    .get(versionEndpoint)
    .then(({ data: { response } }) => {
      log.info(response, `Assuming valid Corteza API at ${csCtx.system.apiBaseURL}`)
    })
    .catch((r) => {
      log.error(`check your Corteza API settings: expecting valid response for ${versionEndpoint} got: ${r}`)
    })

  log.info('checking API endpoints')



  log.debug(feCtx, 'frontend settings')
}

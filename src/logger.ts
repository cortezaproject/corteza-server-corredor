import pino from 'pino'
import { logger } from '+config'

export default pino({
  // see https://getpino.io/#/docs/api?id=options
  enabled: true,
  base: null,
  prettyPrint: false,
  ...logger
})

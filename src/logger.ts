import { logger } from './config'
import pino from 'pino'

export default pino({
  // see https://getpino.io/#/docs/api?id=options
  enabled: true,
  base: null,
  prettyPrint: false,
  ...logger
})

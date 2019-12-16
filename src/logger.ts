// @ts-ignore
import { logger } from './config'

export default require('pino')({
  // see https://getpino.io/#/docs/api?id=options
  enabled: true,
  base: null,
  prettyPrint: false,
  ...logger
})

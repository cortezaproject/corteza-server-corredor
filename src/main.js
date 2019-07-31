import gRPCserver from './grpc-server'
import logger from './logger'
import * as config from './config'

if (config.debug) {
  // Output our configuration
  logger.debug(config)
}

gRPCserver(config.server)


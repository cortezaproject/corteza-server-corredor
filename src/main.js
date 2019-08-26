import gRPCServer from './grpc-server'
import logger from './logger'
import * as config from './config'

if (config.debug) {
  // Output our configuration
  logger.debug(config)
}

gRPCServer(config.server)


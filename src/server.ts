import logger from './logger'
import gRPC from 'grpc'

interface IServerConfig {
  addr: string
}

interface IServerConfigurator {
  (srv: gRPC.Server): void
}

/**
 * Initializes the server
 * @param {IServerConfig} config Server configuration
 * @param {IServerConfigurator} callback Server configurator callback
 */
export default ({ addr }: IServerConfig,
                callback: IServerConfigurator) => {
  const server = new gRPC.Server()

  const handle = () => {
    // Override signal handler with more severe approach
    process.on('SIGINT', () => {
      logger.warn(`forcing gRPC server to stop`)
      server.forceShutdown()
    })

    logger.debug(`trying to stop gRPC server`)
    server.tryShutdown(() => {
      logger.info(`gRPC server stopped`)
    })
  }

  process.on('SIGINT', handle);
  process.on('SIGTERM', handle);

  // Allow registration of servies
  callback(server)

  if (server.bind(addr, gRPC.ServerCredentials.createInsecure()) === 0) {
    logger.error(`could not bind gRPC server to ${addr}`)
    return
  }

  logger.info(`gRPC server running at ${addr}`)
  server.start()
}

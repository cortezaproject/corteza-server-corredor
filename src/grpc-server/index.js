import grpc from 'grpc'
import mountServices from './services'
import logger from '../logger'

export default ({ addr } = {}) => {
  const server = new grpc.Server()

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

  mountServices(server)

  if (server.bind(addr, grpc.ServerCredentials.createInsecure()) === 0) {
    logger.error(`could not bind gRPC server to ${addr}`)
    return
  }

  logger.info(`gRPC server running at ${addr}`)
  server.start()
}

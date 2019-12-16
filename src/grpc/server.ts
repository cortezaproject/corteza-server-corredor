import logger from '../logger'
import grpc from 'grpc'

interface IServerConfig {
  addr: string;
}

interface IServerConfigurator {
  (srv: grpc.Server): void;
}

export type ServiceDefinition = Map<grpc.ServiceDefinition<any>, any>

/**
 * Initializes the server
 * @param {IServerConfig} config Server configuration
 * @param {ServiceDefinition} services
 */
export function Start ({ addr }: IServerConfig, services: ServiceDefinition) {
  const server = new grpc.Server()

  const handle = () => {
    // Override signal handler with more severe approach
    process.on('SIGINT', () => {
      logger.warn('forcing gRPC server to stop')
      server.forceShutdown()
    })

    logger.debug('trying to stop gRPC server')
    server.tryShutdown(() => {
      logger.info('gRPC server stopped')
    })
  }

  process.on('SIGINT', handle)
  process.on('SIGTERM', handle)

  // Allow registration of servies
  services.forEach((implementation, service) => server.addService(service, implementation))

  if (server.bind(addr, grpc.ServerCredentials.createInsecure()) === 0) {
    logger.error(`could not bind gRPC server to ${addr}`)
    return
  }

  logger.info(`gRPC server running at ${addr}`)
  server.start()
}

import logger from '+logger'
import grpc from 'grpc'
import * as fs from 'fs'

interface ServerConfig {
  addr: string;
  certificates: {
    enabled: boolean;
    ca: string;
    private: string;
    public: string;
  };
}

export type ServiceDefinition = Map<grpc.ServiceDefinition<unknown>, unknown>

/**
 * Initializes the server
 * @param {ServerConfig} config Server configuration
 * @param {ServiceDefinition} services
 */
export function Start ({ addr, certificates }: ServerConfig, services: ServiceDefinition): void {
  const server = new grpc.Server()

  const handle = (): void => {
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

  let security = grpc.ServerCredentials.createInsecure()

  if (certificates.enabled) {
    security = grpc.ServerCredentials.createSsl(
      fs.readFileSync(certificates.ca),
      [
        {
          // eslint-disable-next-line @typescript-eslint/camelcase
          cert_chain: fs.readFileSync(certificates.public),
          // eslint-disable-next-line @typescript-eslint/camelcase
          private_key: fs.readFileSync(certificates.private)
        }
      ],
      true
    )
  }

  if (server.bind(addr, security) === 0) {
    logger.error(`could not bind gRPC server to ${addr}`)
    return
  }

  logger.info(`gRPC server running at ${addr}`)
  server.start()
}

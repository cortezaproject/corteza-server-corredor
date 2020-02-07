import * as fs from 'fs'
import grpc from 'grpc'
import { BaseLogger } from 'pino'

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
 */
export function Start ({ addr, certificates }: ServerConfig, logger: BaseLogger, services: ServiceDefinition): void {
  const server = new grpc.Server()
  const log = logger.child({ name: 'gRPC' })

  log.debug('starting server')

  const handle = (): void => {
    // Override signal handler with more severe approach
    process.on('SIGINT', () => {
      log.warn('forcing server to stop')
      server.forceShutdown()
    })

    log.debug('trying to stop the server')
    server.tryShutdown(() => {
      log.info('server stopped')
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
          private_key: fs.readFileSync(certificates.private),
        },
      ],
      true,
    )
  }

  if (server.bind(addr, security) === 0) {
    log.error(`could not bind to ${addr}`)
    return
  }

  log.info(`server running at ${addr}`)
  server.start()
}

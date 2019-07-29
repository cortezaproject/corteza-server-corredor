import grpc from 'grpc'
import mountServices from './services'
import logger from '../logger'

export default ({ addr } = {}) => {
  const server = new grpc.Server()

  mountServices(server)

  server.bind(addr, grpc.ServerCredentials.createInsecure())
  logger.info(`gRPC server running at ${addr}`)
  server.start()
}

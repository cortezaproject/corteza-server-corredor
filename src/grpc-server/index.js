import grpc from 'grpc'
import mountServices from './services'

export default ({ addr = '127.0.0.1:50051' } = {}) => {
  const server = new grpc.Server()

  mountServices(server)

  server.bind(addr, grpc.ServerCredentials.createInsecure())
  console.log(`gRPC server running at ${addr}`)
  server.start()
}

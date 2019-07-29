import grpc from "grpc"
import * as impl from './impl'
import path from 'path'

const protoLoader = require('@grpc/proto-loader')

const CORTEZA_PROTOBUF_PATH = path.normalize(
  process.env.CORTEZA_PROTOBUF_PATH || path.join(__dirname, '/../../../../node_modules/corteza-protobuf')
)
const SCRIPT_RUNNER_PROTO_PATH = path.join(CORTEZA_PROTOBUF_PATH, 'compose/script_runner.proto')

export default (server) => {
  const { compose } = grpc.loadPackageDefinition(protoLoader.loadSync(SCRIPT_RUNNER_PROTO_PATH))
  server.addService(compose.ScriptRunner.service, impl)
}

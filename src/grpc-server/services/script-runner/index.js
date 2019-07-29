import grpc from "grpc"
import path from 'path'
import impl from './impl'
import {protobuf} from '../../../config'

const protoLoader = require('@grpc/proto-loader')

const runnerProtoPath = path.join(protobuf.path, 'compose/script_runner.proto')

export default (server) => {
  const { compose } = grpc.loadPackageDefinition(protoLoader.loadSync(runnerProtoPath))
  server.addService(compose.ScriptRunner.service, impl())
}

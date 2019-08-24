import grpc from "grpc"
import path from 'path'
import impl from './impl'
import {protobuf} from '../../../config'

const protoLoader = require('@grpc/proto-loader')

const base = path.join(protobuf.path, '/compose/script_runner.proto')
const opt = {}

export default (server) => {
  const def = protoLoader.loadSync(base, opt)
  const { compose } = grpc.loadPackageDefinition(def)
  server.addService(compose.ScriptRunner.service, impl())
}

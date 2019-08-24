import grpc from "grpc"
import path from 'path'
import impl from './impl'
import {protobuf} from '../../../config'

const protoLoader = require('@grpc/proto-loader')

const base = path.join(protobuf.path, '/service-corredor.proto')
const opt = {}

export default (server) => {
  const def = protoLoader.loadSync(base, opt)
  const { corredor } = grpc.loadPackageDefinition(def)
  server.addService(corredor.ScriptRunner.service, impl())
}

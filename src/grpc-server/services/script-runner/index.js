import grpc from "grpc"
import path from 'path'
import impl from './impl'
import {protobuf} from '../../../config'

// Making sure we have these where we need them
// might not be neceserry
require('request')
require('axios')
require('lodash')

const protoLoader = require('@grpc/proto-loader')

const base = path.join(protobuf.path, '/service-corredor.proto')
const opt = {}

export default (server) => {
  const def = protoLoader.loadSync(base, opt)
  const { corredor } = grpc.loadPackageDefinition(def)
  server.addService(corredor.ScriptRunner.service, impl())
}

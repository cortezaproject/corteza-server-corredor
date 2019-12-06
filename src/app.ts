// @ts-ignore
import * as config from './config'
import gRPCServer from './server'
import grpc from "grpc";
import path from "path";
import logger from "./logger";
import watcher from './scripts/server/watcher'
import Service from "./scripts/server/service";
import serverScriptsHandlers from './scripts/server/grpc'

const protoLoader = require('@grpc/proto-loader')


/**
 *
 * Main Corredor responsibilities
 *
 *  1. @todo load remote scripts (if not local)
 *  2. @todo watch and reload dependencies (if src/package.json exists)
 *  3. @todo watch frontend-script changes, run tests (if any) and (re)bundle scripts
 *  4. watching backend-script changes and (re)link them to gRPC service
 *     @todo run tests?
 *  5. start gRPC server
 *
 * Misc:
 *   - secret management
 */

logger.debug('loading protobuf')
const base = path.join(config.protobuf.path, '/service-corredor-v2020.3.proto')
const def = protoLoader.loadSync(base, {})
const { corredor } = grpc.loadPackageDefinition(def)

logger.debug('initializing server-scripts service')
const h = new Service(path.join(__dirname, "../usr/src/server"))
h.Load()
watcher(h.path, () => h.Load())

logger.debug('starting gRPC server')
gRPCServer(
    config.server,
    (server : grpc.Server) => {
        server.addService(corredor.ServerScripts.service, serverScriptsHandlers(h))
    },
);

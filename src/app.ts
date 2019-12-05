// @ts-ignore
import * as config from './config'
import gRPCServer from './server'
import grpc from "grpc";
import path from "path";
import logger from "./logger";

const protoLoader = require('@grpc/proto-loader')

import serverScriptsHandlers from './services/server-scripts'
import {ServerScripts} from "./server-scripts";

/**
 *
 * Main Corredor responsibilities
 *
 *  1. @todo load remote scripts (if not local)
 *  2. @todo watch and reload dependencies (if src/package.json exists)
 *  3. @todo watch frontend-script changes, run tests (if any) and (re)bundle scripts
 *  4. @todo watch backend-script changes, run tests (if any) and (re)link them to gRPC service
 *  5. start gRPC server
 *
 * Misc:
 *   - secret management
 */

logger.debug('loading protobuf')
const base = path.join(config.protobuf.path, '/service-corredor-v2020.3.proto')
const def = protoLoader.loadSync(base, {})
const { corredor } = grpc.loadPackageDefinition(def)

// delete require.cache[require.resolve('../usr/src/backend/system')]
// let rval = require('../usr/src/backend/system')
// console.log(rval)
// require('./poc-script-checker.ts')

const h = new ServerScripts(path.join(__dirname, "../usr/src/server"))
h.Load()
h.Watch()

logger.debug('starting gRPC server')
gRPCServer(
    config.server,
    (server : grpc.Server) => {
        server.addService(corredor.ServerScripts.service, serverScriptsHandlers(h))
    },
);

// @ts-ignore
import * as config from './config'
import gRPCServer from './server'
import grpc from "grpc";
import path from "path";
import logger from "./logger";
import serverScriptsWatcher from './scripts/server/watcher'
import dependencyWatcher from './scripts/deps/watcher'
import Service from "./scripts/server/service";
import serverScriptsHandlers from './scripts/server/grpc'
import {Install} from "./scripts/deps/install";

const protoLoader = require('@grpc/proto-loader');

// @todo make configurable
const baseScriptsDir  = path.join(__dirname, '../usr');
// @todo make configurable
const npmDownloadDir = path.join(__dirname, '../node_modules');
// @todo make configurable
const packageJSON = path.join(baseScriptsDir, 'package.json');
// @todo make configurable
const serverScriptsDir = path.join(baseScriptsDir, "src/server");

// @todo make configurable
const assumeInstalledDependencies : boolean = true;

/**
 *
 * Main Corredor responsibilities
 *
 *  1. @todo load remote (git-repo) scripts (if not local)
 *  2. watch and reload dependencies (if src/package.json exists)
 *  3. @todo watch frontend-script changes, run tests (if any) and (re)bundle scripts
 *  4. watching backend-script changes and (re)link them to gRPC service
 *     @todo run tests?
 *  5. start gRPC server
 *
 * Misc:
 *   - secret management
 */

logger.debug('loading protobuf');
const base = path.join(config.protobuf.path, '/service-corredor-v2020.3.proto');
const def = protoLoader.loadSync(base, {});
const { corredor } = grpc.loadPackageDefinition(def);

logger.debug('initializing server-scripts service');
const serverScriptsService = new Service(serverScriptsDir);

async function installDependencies() {
    logger.info('installing dependencies', packageJSON);
    return Install(packageJSON, npmDownloadDir)
}

async function reloadServerScripts() {
    // Reload scripts every-time packages change!
    logger.info('reloading server scripts');
    return serverScriptsService.Load();
}

(async () => {
    if (!assumeInstalledDependencies) {
        await installDependencies()
    }

    return reloadServerScripts()
})().then(() => {
    return dependencyWatcher(packageJSON, async () => {
        await installDependencies();

        // Reload scripts every-time packages change!
        return reloadServerScripts();
    })
}).then(() => {
    return serverScriptsWatcher(serverScriptsService.path, reloadServerScripts)
}).then(() => {
    logger.debug('starting gRPC server');
    gRPCServer(
        config.server,
        (server : grpc.Server) => {
            server.addService(corredor.ServerScripts.service, serverScriptsHandlers(serverScriptsService))
        },
    );
});



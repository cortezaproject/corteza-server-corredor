// @ts-ignore
import * as config from './config'
import path from "path";
import logger from "./logger";
import * as deps from './scripts/deps'
import * as serverScripts from "./scripts/server";
import * as gRPCServer from './grpc'
import {ServiceDefinition} from "./grpc";


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


logger.debug('initializing server-scripts service');
const serverScriptsService = new serverScripts.Service();

async function installDependencies() {
    logger.info('installing dependencies from %s', config.scripts.dependencies.packageJSON);
    return deps.Install(
        config.scripts.dependencies.packageJSON,
        config.scripts.dependencies.nodeModules)
}

async function reloadServerScripts() {
    // Reload scripts every-time packages change!
    logger.info('reloading server scripts');
    return serverScripts.Reloader(config.scripts.server.basedir)
        .then((scripts: serverScripts.IScript[]) => {
            logger.debug('%d server scripts loaded', scripts.length);
            serverScriptsService.Update(scripts)
        })
}

/**
 * App entry point
 */
(async () => {
    /**
     * Install dependencies & make initial server-script load
     */

    if (!config.scripts.dependencies.assumeInstalled) {
        await installDependencies()
    }

    return reloadServerScripts()
})().then(() => {
    /**
     * Setup dependency watcher that installs dependencies on
     * change & reloads server-scripts
     */

    return deps.Watcher(config.scripts.dependencies.packageJSON, async () => {
        await installDependencies();

        // Reload scripts every-time packages change!
        return reloadServerScripts();
    })
}).then(() => {
    /**
     * Setup server-script watcher that will reload server-side scripts
     */

    return serverScripts.Watcher(config.scripts.server.basedir, reloadServerScripts)
})


gRPCServer.LoadDefinitions(path.join(config.protobuf.path, '/service-corredor-v2020.3.proto')).then((
        // @ts-ignore
        { corredor: { ServerScripts } }
    ) => {
    const svcdef: ServiceDefinition = new Map()
    svcdef.set(ServerScripts.service, serverScripts.Handlers(
            serverScriptsService,
            logger.child({ system: 'gRPC', service: 'server-scripts'  })
        )
    )

    logger.debug('starting gRPC server');
    gRPCServer.Start(config.server, svcdef);
});



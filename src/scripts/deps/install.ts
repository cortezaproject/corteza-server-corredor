// @ts-ignore
import downloadNpmPackage from 'download-npm-package';
import fs from "fs";
import {IDependencyMap, IPackageInstallStatus} from "./d";
import logger from "../../logger";


export function Dependencies (packageJsonPath: string) : IDependencyMap|undefined {
    if (!fs.existsSync(packageJsonPath)) {
        return undefined
    }

    const packageJson = fs.readFileSync(packageJsonPath)
    const pkg = JSON.parse(packageJson.toString())
    return Object.assign(
        {},
        pkg.dependencies,
        pkg.devDependencies,
    );
}

/**
 * Downloads NPM package
 *
 * @param {string } arg Name of the package to be downloaded
 * @param {string} dir path to node_modules
 * @constructor
 */
export async function Download (arg : string, dir : string) : Promise<any> {
    return downloadNpmPackage({ arg, dir })
}

/**
 * Orchestrates download and install of NPM packages from package.json
 *
 * @param {string} packageJsonPath Path to package.json file
 * @constructor
 */
export async function Install(packageJsonPath : string, nodeModulesDir : string) : Promise<IPackageInstallStatus[]> {
    const pp : Promise<any>[] = [];
    const deps = Dependencies(packageJsonPath);

    if (deps === undefined) {
        throw Error('No dependencies found')
    }

    let version : string
    for (let name in deps) {
        pp.push(Download(`${name}@${deps[name]}`, nodeModulesDir).then(() => {
            logger.debug('package installed', { name, version: deps[name] })
            return { name, version: deps[name], installed: true }
        }))
    }

    return Promise.all(pp)
}

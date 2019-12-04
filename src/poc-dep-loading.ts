// @ts-ignore
import downloadNpmPackage from 'download-npm-package';
import fs from 'fs'
import path from 'path'

const npmDownloadDir = path.join(__dirname, '../node_modules')
const usrDir = path.join(__dirname, '../usr')
const packageJson = path.join(usrDir, 'package.json')

interface IPackageJSON {
    readonly dependencies?: IDependencyMap;
}

interface IDependencyMap {
    [dependencyName: string]: string;
}

interface IPackageInstallStatus {
    name: string
    version: string
    installed: boolean
}

function getDependencies (source: string = packageJson) : IDependencyMap|undefined {
    if (!fs.existsSync(source)) {
        return undefined
    }

    const pkgjson= fs.readFileSync(source)
    const pkg: IPackageJSON =  JSON.parse(pkgjson.toString())
    return pkg.dependencies
}

async function downloadPackage (arg : string) : Promise<any> {
    return downloadNpmPackage({ arg, dir: npmDownloadDir })
}

async function install() : Promise<IPackageInstallStatus[]> {
    const pp : Promise<any>[] = [];
    const deps = getDependencies();

    if (deps === undefined) {
        throw Error('No dependencies found')
    }

    let version : string
    for (let name in deps) {
        pp.push(downloadPackage(`${name}@${deps[name]}`).then(() => {
            return { name, version: deps[name], installed: true }
        }))
    }

    return Promise.all(pp)
}

install().then(x => {
    console.log(x)
})



console.log('Done')




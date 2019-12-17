/* eslint-disable @typescript-eslint/ban-ts-ignore */

// @ts-ignore
import downloadNpmPackage from 'download-npm-package'
import fs from 'fs'
import { DependencyMap, PackageInstallStatus } from '.'
import logger from '+logger'

export function Dependencies (packageJsonPath: string): DependencyMap|undefined {
  if (!fs.existsSync(packageJsonPath)) {
    return undefined
  }

  const packageJson = fs.readFileSync(packageJsonPath)
  const pkg = JSON.parse(packageJson.toString())
  return Object.assign(
    {},
    pkg.dependencies,
    pkg.devDependencies
  )
}

/**
 * Downloads NPM package
 *
 * @param {string } arg Name of the package to be downloaded
 * @param {string} dir path to node_modules
 * @constructor
 */
export async function Download (arg: string, dir: string): Promise<unknown> {
  return downloadNpmPackage({ arg, dir })
}

/**
 * Orchestrates download and install of NPM packages from package.json
 *
 * @todo should be able verify (from first/previous run) what was installed and if there are changes.
 *
 *
 * @param {string} packageJsonPath Path to package.json file
 * @param nodeModulesDir
 * @constructor
 */
export async function Install (packageJsonPath: string, nodeModulesDir: string): Promise<PackageInstallStatus[]> {
  const pp: Promise<PackageInstallStatus>[] = []
  const deps = Dependencies(packageJsonPath)

  if (deps === undefined) {
    throw Error('No dependencies found')
  }

  for (const name in deps) {
    if (!Object.prototype.hasOwnProperty.call(deps, name)) {
      continue
    }

    pp.push(Download(`${name}@${deps[name]}`, nodeModulesDir).then((): PackageInstallStatus => {
      logger.debug('package installed', { name, version: deps[name] })
      return { name, version: deps[name], installed: true }
    }))
  }

  return Promise.all(pp)
}

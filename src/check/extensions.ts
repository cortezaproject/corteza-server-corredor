import { extensions } from '../config'
import logger from '../logger'

import path from 'path'
import fs from 'fs'
import { canAccessPath } from './fs'

function depCheck (): void {
  const d = extensions.dependencies
  if (!d.autoUpdate) {
    return
  }

  const log = logger.child({ name: 'check' })

  if (!canAccessPath(d.nodeModules, fs.constants.W_OK)) {
    log.warn({ path: d.nodeModules }, 'modules installation path is not writable, disabling dependency auto-update')
    d.autoUpdate = false
    return
  }

  if (!canAccessPath(d.packageJSON)) {
    log.warn({ path: d.packageJSON }, 'package.json not found, disabling dependency auto-update')
    d.autoUpdate = false
  }

  d.nodeModules = path.resolve(d.nodeModules)
  d.packageJSON = path.resolve(d.packageJSON)
  log.debug({ location: d.nodeModules, packageJSON: d.packageJSON }, 'node_modules location configured')
}

export default function () {
  depCheck()
}

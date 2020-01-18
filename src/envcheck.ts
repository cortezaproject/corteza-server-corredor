import logger from './logger'
import fs from 'fs'
import path from 'path'
import * as config from './config'

function ctxCheck () {
  logger.info('server-scripts service configured')
  logger.debug(
    config.scripts.exec.cServers.system,
    'configuring cServer system API',
  )
  logger.debug(
    config.scripts.exec.cServers.compose,
    'configuring cServer compose API',
  )
  logger.debug(
    config.scripts.exec.cServers.messaging,
    'configuring cServer messaging API',
  )
}

function scriptCheck (type: string, s) {
  if (!s.enabled) {
    logger.warn('%s scripts disabled', type)
    return
  }

  try {
    fs.lstatSync(s.basedir)
    s.basedir = path.resolve(s.basedir)
    logger.debug({ path: s.basedir }, '%s scripts location configured', type)
  } catch (error) {
    logger.error({ path: s.basedir }, 'can not configure %s scripts location', type)
    s.enabled = false
  }
}

function depCheck (d) {
  if (d.autoUpdate) {
    try {
      fs.accessSync(d.nodeModules, fs.constants.W_OK)
      d.nodeModules = path.resolve(d.nodeModules)
      logger.debug({ location: d.nodeModules }, 'node_modules location configured')
    } catch (err) {
      logger.warn({ path: d.nodeModules }, 'modules installation path is not writable, disabling dependency auto-update')
      d.autoUpdate = false
    }
  }

  if (d.autoUpdate) {
    try {
      fs.lstatSync(d.packageJSON)
      d.packageJSON = path.resolve(d.packageJSON)
    } catch (err) {
      logger.warn({ path: d.packageJSON }, 'package.json not found, disabling dependency auto-update')
      d.autoUpdate = false
    }
  }
}

export function EnvCheck () {
  logger.info('server-scripts service configured')
  logger.debug(
    config.scripts.exec.cServers.system,
    'configuring cServer system API',
  )
  logger.debug(
    config.scripts.exec.cServers.compose,
    'configuring cServer compose API',
  )
  logger.debug(
    config.scripts.exec.cServers.messaging,
    'configuring cServer messaging API',
  )

  const s = config.scripts

  scriptCheck('base', s)
  if (!s.enabled) {
    // if scripts are disabled
    // there's not much for us to do here
    return
  }

  scriptCheck('server', s.server)
  scriptCheck('client', s.client)

  depCheck(config.scripts.dependencies)
}

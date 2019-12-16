import path from 'path'

// Read .env into process.ENV.*
require('dotenv').config()

const rootDir = path.normalize(path.join(__dirname, '../'))

function undef () {
  for (const arg of arguments) {
    if (arg !== undefined) {
      return arg
    }
  }

  return undefined
}

function isModuleInstalled (module) {
  try {
    require.resolve(module)
    return true
  } catch (e) {
    return false
  }
}

export const env = (undef(
  process.env.CORREDOR_ENVIRONMENT,
  process.env.CORREDOR_ENV,
  process.env.NODE_ENV,
  'prod')).trim().toLowerCase()
export const isProduction = env.indexOf('prod') === 0
export const isDevelopment = env.indexOf('dev') === 0

// Detect if debug mode should be enabled
// Is it explicitly set on by DEBUG?
// Is ENVIRONMENT set to production?
export const debug = !!undef(process.env.CORREDOR_DEBUG, !isProduction)

// Server settings
// CORREDOR_ADDR is used by the API as well to configure gRPC client connection
export const server = {
  addr: process.env.CORREDOR_ADDR || '0.0.0.0:50051'
}

export const logger = {
  // Enable/disable logging
  // CORREDOR_LOG_ENABLED is used by the API as well to configure gRPC client logging
  enabled: !!undef(process.env.CORREDOR_LOG_ENABLED, true),

  // Enable/disable pretty logging
  //
  // if LOG_PRETTY is set or inherit from debug
  prettyPrint: !!undef(process.env.CORREDOR_LOG_PRETTY, debug) && isModuleInstalled('pino-pretty'),

  // Log level
  level: undef(process.env.CORREDOR_LOG_LEVEL, debug ? 'trace' : 'info')
}

export const protobuf = {
  path: path.normalize(undef(process.env.CORREDOR_CORTEZA_PROTOBUF_PATH, path.join(rootDir, 'node_modules/corteza-protobuf')))
}

export const services = {
  scriptRunner: {
    timeout: {
      max: 30 * 1000, // 30s
      min: 100, // 0.1s
      def: 2 * 1000 // 2s
    }
  }
}

const scriptsBaseDir = path.normalize(undef(process.env.CORREDOR_SCRIPTS_BASEDIR, path.join(rootDir, 'usr')))
const assembleCServerBaseURL = (service) => {
  const host = undef(
    process.env.CORREDOR_EXEC_CSERVERS_API_HOST,
    // DOMAIN will be present in the standard configuration
    process.env.DOMAIN,
    // Other ways to get to the hostname
    process.env.HOSTNAME,
    process.env.HOST
  )

  if (host === undefined) {
    return undefined
  }

  const tpl = undef(
    // will replace HOST and SERVICE
    process.env.CORREDOR_EXEC_CSERVERS_API_BASEURL_TEMPLATE,
    // Assume standard "api." prefix for the API
    'https://api.{host}/{service}'
  )

  return tpl
    .replace('{host}', host)
    .replace('{service}', service)
}

export const scripts = {
  // where user scripts are
  basedir: scriptsBaseDir,

  dependencies: {
    // where to get script's dependencies from
    packageJSON: path.join(scriptsBaseDir, 'package.json'),

    // where to install downloaded NPM packages
    nodeModules: path.join(rootDir, 'node_modules'),

    // assume installed packages on first load
    assumeInstalled: debug
  },

  exec: {
    cServers: {
      system: {
        baseURL: undef(assembleCServerBaseURL('system'), process.env.CORREDOR_EXEC_CSERVERS_SYSTEM_API_BASEURL)
      },

      compose: {
        baseURL: undef(assembleCServerBaseURL('compose'), process.env.CORREDOR_EXEC_CSERVERS_COMPOSE_API_BASEURL)
      },

      messaging: {
        baseURL: undef(assembleCServerBaseURL('messaging'), process.env.CORREDOR_EXEC_CSERVERS_MESSAGING_API_BASEURL)
      }
    }
  },

  server: {
    // location of server scripts
    basedir: path.join(scriptsBaseDir, 'src/server')
  },

  client: {
    // location of client scripts
    basedir: path.join(scriptsBaseDir, 'src/client')
  }
}

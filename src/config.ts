import path from 'path'

// Read .env into process.ENV.*
require('dotenv').config()

// Let's make our code a bit shorter
const e = process.env

const rootDir = path.normalize(path.join(__dirname, '../'))

function isTrue (input: string|undefined): boolean|undefined {
  if (undefined === input) {
    return
  }

  return /^s*(t(rue)?|y(es)?|1)s*$/i.test(input)
}

/**
 * Verifies if module is install by requiring it
 * @param module
 */
function isModuleInstalled (module: string): boolean {
  try {
    require.resolve(module)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Discovers/generates baseURL from environmental variables & given service
 *
 * @param {string} service
 * @returns {string|undefined}
 */
function assembleBaseURL (service: string): string|undefined {
  const host =
      e.CORREDOR_EXEC_CSERVERS_API_HOST ??
      // DOMAIN will be present in the standard configuration
      e.DOMAIN ??
      // Other ways to get to the hostname
      e.HOSTNAME ??
      e.HOST

  if (host === undefined) {
    return undefined
  }

  const tpl =
      // will replace HOST and SERVICE
      e.CORREDOR_EXEC_CSERVERS_API_BASEURL_TEMPLATE ??

      // Assume standard "api." prefix for the API
      'https://api.{host}/{service}'

  return tpl
    .replace('{host}', host)
    .replace('{service}', service)
}

export const env = (e.CORREDOR_ENVIRONMENT ?? e.CORREDOR_ENV ?? e.NODE_ENV ?? 'prod').trim().toLowerCase()

export const isProduction = env.indexOf('prod') === 0
export const isDevelopment = env.indexOf('dev') === 0

// Detect if debug mode should be enabled
// Is it explicitly set on by DEBUG?
// Is ENVIRONMENT set to production?
export const debug = isTrue(e.CORREDOR_DEBUG) ?? !isProduction

const certPath = e.CORREDOR_SERVER_CERTIFICATES_PATH ?? './certs/server'

// Server settings
// CORREDOR_ADDR is used by the API as well to configure gRPC client connection
export const server = {
  addr: e.CORREDOR_ADDR || '0.0.0.0:50051',

  certificates: {
    enabled:
        isTrue(e.CORREDOR_SERVER_CERTIFICATES_ENABLED) ?? true,
    ca:
        e.CORREDOR_SERVER_CERTIFICATES_CA ?? path.join(certPath, 'ca.crt'),
    private:
        e.CORREDOR_SERVER_CERTIFICATES_PRIVATE ?? path.join(certPath, 'private.key'),
    public:
        e.CORREDOR_SERVER_CERTIFICATES_PUBLIC ?? path.join(certPath, 'public.crt')
  }
}

export const logger = {
  // Enable/disable logging
  // CORREDOR_LOG_ENABLED is used by the API as well to configure gRPC client logging
  enabled: isTrue(e.CORREDOR_LOG_ENABLED) ?? true,

  // Enable/disable pretty logging
  //
  // if LOG_PRETTY is set or inherit from debug
  prettyPrint: (isTrue(e.CORREDOR_LOG_PRETTY) ?? debug) && isModuleInstalled('pino-pretty'),

  // Log level
  level: e.CORREDOR_LOG_LEVEL ?? (debug ? 'trace' : 'info')
}

export const protobuf = {
  path: path.normalize(e.CORREDOR_CORTEZA_PROTOBUF_PATH ?? path.join(rootDir, 'node_modules/corteza-protobuf'))
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

const scriptsBaseDir = path.normalize(e.CORREDOR_SCRIPTS_BASEDIR ?? path.join(rootDir, 'usr'))

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
        apiBaseURL: assembleBaseURL('system') ?? e.CORREDOR_EXEC_CSERVERS_SYSTEM_API_BASEURL
      },

      compose: {
        apiBaseURL: assembleBaseURL('compose') ?? e.CORREDOR_EXEC_CSERVERS_COMPOSE_API_BASEURL
      },

      messaging: {
        apiBaseURL: assembleBaseURL('messaging') ?? e.CORREDOR_EXEC_CSERVERS_MESSAGING_API_BASEURL
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

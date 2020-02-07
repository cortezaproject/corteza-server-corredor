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

export const isDevelopment = env.indexOf('dev') === 0
export const isProduction = !isDevelopment

const certPath = e.CORREDOR_SERVER_CERTIFICATES_PATH ?? '/certs'

// Server settings
// CORREDOR_ADDR is used by the API as well to configure gRPC client connection
export const server = {
  addr: e.CORREDOR_ADDR || 'localhost:50051',

  certificates: {
    enabled:
        isTrue(e.CORREDOR_SERVER_CERTIFICATES_ENABLED) ?? isProduction,
    ca:
        e.CORREDOR_SERVER_CERTIFICATES_CA ?? path.join(certPath, 'ca.crt'),
    private:
        e.CORREDOR_SERVER_CERTIFICATES_PRIVATE ?? path.join(certPath, 'private.key'),
    public:
        e.CORREDOR_SERVER_CERTIFICATES_PUBLIC ?? path.join(certPath, 'public.crt'),
  },
}

export const logger = {
  // Enable/disable logging
  // CORREDOR_LOG_ENABLED is used by the API as well to configure gRPC client logging
  enabled: isTrue(e.CORREDOR_LOG_ENABLED) ?? true,

  // Enable/disable pretty logging
  //
  // if LOG_PRETTY is set or inherit from debug
  prettyPrint: isTrue(e.CORREDOR_LOG_PRETTY) ?? isDevelopment,

  // Log level
  level: e.CORREDOR_LOG_LEVEL ?? (isDevelopment ? 'trace' : 'info'),
}

export const protobuf = {
  path: path.normalize(e.CORREDOR_CORTEZA_PROTOBUF_PATH ?? path.join(rootDir, 'node_modules/corteza-protobuf')),
}

export const services = {
  scriptRunner: {
    timeout: {
      max: 30 * 1000, // 30s
      min: 100, // 0.1s
      def: 2 * 1000, // 2s
    },
  },
}

const scriptsBaseDir = path.normalize(e.CORREDOR_SCRIPTS_BASEDIR ?? path.join(rootDir, 'usr'))

export const scripts = {
  // where user scripts are
  basedir: scriptsBaseDir,
  enabled: true,

  dependencies: {
    // where to get script's dependencies from
    packageJSON: e.CORREDOR_SCRIPTS_PACKAGE_JSON_FILE ?? path.join(scriptsBaseDir, 'package.json'),

    // where to install downloaded NPM packages
    nodeModules: e.CORREDOR_SCRIPTS_NODE_MODULES_DIR ?? path.join(rootDir, 'node_modules'),

    // do we automatically update deps?
    autoUpdate: isTrue(e.CORREDOR_SCRIPTS_AUTO_UPDATE_DEPENDENCIES) ?? true,
  },

  // exec context
  exec: {
    cServers: {
      system: {
        apiBaseURL: assembleBaseURL('system') ?? e.CORREDOR_EXEC_CSERVERS_SYSTEM_API_BASEURL,
      },

      compose: {
        apiBaseURL: assembleBaseURL('compose') ?? e.CORREDOR_EXEC_CSERVERS_COMPOSE_API_BASEURL,
      },

      messaging: {
        apiBaseURL: assembleBaseURL('messaging') ?? e.CORREDOR_EXEC_CSERVERS_MESSAGING_API_BASEURL,
      },
    },
  },

  server: {
    // location of server scripts
    basedir: path.resolve(e.CORREDOR_SCRIPTS_SERVER_BASEDIR ?? path.join(scriptsBaseDir, 'src/server')),

    enabled: isTrue(e.CORREDOR_SCRIPTS_SERVER_ENABLED) ?? true,
    watch: isTrue(e.CORREDOR_SCRIPTS_SERVER_WATCH) ?? true,
  },

  client: {
    // location of client scripts
    basedir: path.resolve(e.CORREDOR_SCRIPTS_CLIENT_BASEDIR ?? path.join(scriptsBaseDir, 'src/client')),

    enabled: isTrue(e.CORREDOR_SCRIPTS_CLIENT_ENABLED) ?? true,
    watch: isTrue(e.CORREDOR_SCRIPTS_CLIENT_WATCH) ?? true,

    bundleOutputPath: path.resolve(e.CORREDOR_SCRIPTS_CLIENT_BUNDLE_OUTPUT_PATH ?? '/tmp/corredor/client-scripts-dist'),
  },
}

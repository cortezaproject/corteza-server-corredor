// Read .env into process.ENV.*
import path from "path"

require('dotenv').config()

function undef () {
  for (let arg of arguments) {
    if (arg !== undefined) {
      return arg
    }
  }

  return undefined
}

function apiBaseURL (service) {
  let tmpl = undef(process.env.SCRIPT_RUNNER_API_BASE_URL_TEMPLATE, 'https://api.local.cortezaproject.org/${service}')
  return tmpl.replace('${service}', service)
}

function isModuleInstalled(module) {
  try {
    require.resolve(module)
    return true
  } catch (e) {
    return false
  }
}

export const env = (process.env.ENVIRONMENT || 'prod').trim().toLowerCase()
export const isProduction = env.indexOf('prod') === 0
export const isDevelopment = env.indexOf('dev') === 0

// Detect if debug mode should be enabled
// Is it explicitly set on by DEBUG?
// Is ENVIRONMENT set to production?
export const debug = !!undef(process.env.DEBUG, !isProduction)

// Server settings
export const server = {
  addr: process.env.ADDR || '0.0.0.0:50051',
}

export const logger = {
  // Enable/disable logging
  enabled: !!undef(process.env.LOG_ENABLED, true),

  // Enable/disable pretty logging
  //
  // if LOG_PRETTY is set or inherit from debug
  prettyPrint: !!undef(process.env.LOG_PRETTY, debug) && isModuleInstalled('pino-pretty'),

  // Log level
  level: undef(process.env.LOG_LEVEL, debug ? 'trace' : 'info'),
}

export const protobuf = {
  path: path.normalize(undef(process.env.CORTEZA_PROTOBUF_PATH, path.join(__dirname, '../node_modules/corteza-protobuf'))),
}

export const services = {
  scriptRunner: {
    timeout: {
      max: 30 * 1000, // 30s
      min: 100, // 0.1s
      def: 2 * 1000, // 2s
    },

    apiClients: {
      compose: {
        baseURL: undef(process.env.SCRIPT_RUNNER_API_COMPOSE_BASE_URL, apiBaseURL('compose')),
      },
      messaging: {
        baseURL: undef(process.env.SCRIPT_RUNNER_API_MESSAGING_BASE_URL, apiBaseURL('messaging')),
      },
      system: {
        baseURL: undef(process.env.SCRIPT_RUNNER_API_SYSTEM_BASE_URL, apiBaseURL('system')),
      },
    },
  },
}

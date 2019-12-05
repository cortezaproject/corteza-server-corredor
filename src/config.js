import path from "path"

// Read .env into process.ENV.*
require('dotenv').config()

function undef () {
  for (let arg of arguments) {
    if (arg !== undefined) {
      return arg
    }
  }

  return undefined
}

function isModuleInstalled(module) {
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
  addr: process.env.CORREDOR_ADDR || '0.0.0.0:50051',
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
  level: undef(process.env.CORREDOR_LOG_LEVEL, debug ? 'trace' : 'info'),
}

export const protobuf = {
  path: path.normalize(undef(process.env.CORREDOR_CORTEZA_PROTOBUF_PATH, path.join(__dirname, '../node_modules/corteza-protobuf'))),
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

import scriptMaker from './script-maker'
import executor from './executor'
import context, {Abort} from './context'
import grpc from "grpc"
import {Compose, Messaging, System} from './rest-clients'

let apiClients = {
  compose: Compose({ baseURL: 'http://localhost:3001' }),
  messaging: Messaging({ baseURL: 'http://localhost:3000' }),
  system: System({ baseURL: 'http://localhost:3002' }),
}

const setupScriptRunner = async (request = {}) => {
  let vmScript
  try {
    let { script = '' } = request
    vmScript = scriptMaker(script)
  } catch(e) {
    return Promise.reject(e)
  }
  let e = executor(vmScript, context(request, apiClients))

  return e
}

const handleError = (done) => (e) => {
  if (e instanceof SyntaxError) {
    // SyntaxError
    //
    // when something is wrong in the automatino script
    done({ message: e.message + '\n\n' + e.stack, code: grpc.status.INVALID_ARGUMENT })
  } else if (e instanceof Abort) {
    // Abort
    //
    // Custom error provided to automation scripts to
    // allow more control over script execution flow
    done({ message: e.message || 'Aborted', code: grpc.status.ABORTED })
  } else if (e instanceof Error) {
    // Error
    //
    // General error handling
    done({ message: e.message + '\n\n' + e.stack, code: grpc.status.INTERNAL })
  } else if (typeof e === 'string') {
    // (string)
    //
    // Properly handle code that does `throw 'foo'`
    done({ message: e, code: grpc.status.ABORTED })
  }
}

// Testing the script
export function Test ({ request }, done) {
  try {
    scriptMaker(request).compile()
    done(null, {})
  } catch (e) {
    handleError(done)(e)
  }
}

// Namespace automation scripts
export function Namespace ({ request }, done) {
  setupScriptRunner(request).then(namespace => {
    if (!namespace) {
      done(null, {})
    }

    done(null, { namespace: namespace })
  }).catch(handleError(done))
}

// Module automation scripts
export function Module ({ request }, done) {
  setupScriptRunner(request).then(module => {
    if (!module) {
      done(null, {})
    }

    done(null, { module: module })
  }).catch(handleError(done))
}

// Record automation script execution
export function Record ({ request }, done) {
  setupScriptRunner(request).then(record => {
    if (!record) {
      done(null, {})
    }

    done(null, { record: { ...record, values: record.serializeValues() } })
  }).catch(handleError(done))
}

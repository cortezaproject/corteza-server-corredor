import {NodeVM, VMScript} from "vm2"
import {ComposeObject} from '../../../types/common'
import Record from '../../../types/record'
import Module from '../../../types/module'
import Namespace from '../../../types/namespace'
import { services as svcConfig } from '../../../config'

const timeouts = svcConfig.scriptRunner.timeout

export class AuthError extends Error {}

const castResult = (rval, sandbox) => {
  if (rval !== false) {
    // Script was not explicitly aborted
    if (rval instanceof Promise) {
      return rval.then((v) => {
        // cast resolved value
        return castResult(v, sandbox)
      }).catch(err => {
        if (!err) {
          // No error/value was given to rejection,
          // assuming we want tell the call we're canceling the operation
          return false
        } else {
          return Promise.reject(err)
        }
      })
    }


    if (rval instanceof ComposeObject) {
      // Value explicitly returned
      return rval
    }

    // Value was not explicitly returned,
    // pick one of sandbox values (by order of importance)
    if (sandbox.$record instanceof Record) {
      return sandbox.$record
    }
    if (sandbox.$module instanceof Module) {
      return sandbox.$module
    }
    if (sandbox.$namespace instanceof Namespace) {
      return sandbox.$namespace
    }

    // Script was not aborted but there is really nothing
    // that we could return, so return undefined (and not false)
    return undefined
  }

  // Script was explicitly aborted,
  // let the caller know
  return false
}

export default async (vmScript, sandbox = {}, { timeout = timeouts.def, async = false } = {}) => {
  if (!(vmScript instanceof VMScript)) {
    throw new ReferenceError(`Expecting VMScript object (got ${typeof vmScrpt})`)
  }

  if (timeout > timeouts.max) {
    timeout = timeouts.max
  } else if (timeout < timeouts.min) {
    timeout = timeouts.min
  }

  return new Promise((resolve) => {
    if (async) {
      // Async call, resolve right away
      resolve()
    }

    const vm = new NodeVM({
      sandbox,

      // Disallow require()
      require: false,

      // timeout after ??
      timeout,

      // Allow console use
      // @todo how can we capture console output and
      //       serve it back with gRPC response?
      //       https://stackoverflow.com/a/50333959
      console: 'inherit',

      // No wrapper - we need the result
      // from the script
      wrapper: 'none',
    })

    resolve(castResult(vm.run(vmScript), sandbox))
  })
}

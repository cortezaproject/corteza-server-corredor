import Record from '../../../types/record'
import Module from '../../../types/module'
import Namespace from '../../../types/namespace'
import helpers from './helpers'

export class Abort extends Error {}

export default (request, restAPI) => {
  let $namespace, $module, $record

  // Cast namespace, module,  record to internal types
  if (request.namespace) {
    $namespace = new Namespace(request.namespace)
  }

  if (request.module) {
    $module = new Module(request.module)

    if (request.record) {
      $record = new Record($module, request.record)
    }
  }

  const { JWT } = request

  // Setup REST API handlers for the context (ctx)
  if (restAPI) {
    restAPI.compose.setJWT(JWT)
    restAPI.messaging.setJWT(JWT)
    restAPI.system.setJWT(JWT)
  }

  const input = {
    $namespace,
    $module,
    $record,
  }

  const ctx = {
    // Types
    Record,
    Module,
    Namespace,

    // Errors
    Abort,

    // caller's input
    ...input,

    // all API proxies & helpers we provide to
    // automation script authors
    ...helpers(restAPI, input),
  }

  return ctx
}

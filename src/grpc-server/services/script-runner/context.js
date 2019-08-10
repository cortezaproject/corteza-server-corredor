import Record from 'corteza-webapp-common/src/lib/types/compose/record'
import Module from 'corteza-webapp-common/src/lib/types/compose/module'
import Namespace from 'corteza-webapp-common/src/lib/types/compose/namespace'
import helpers from 'corteza-webapp-common/src/lib/corredor/api-helpers'
import { Abort } from 'corteza-webapp-common/src/lib/corredor/errors'

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

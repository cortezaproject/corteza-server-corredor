import Record from '../../../types/record'
import Module from '../../../types/module'
import Namespace from '../../../types/namespace'


export class Abort extends Error {}

export default (request, restAPI) => {
  let $namespace, $module, $record

  // Cast namespace, module,  record to internal types
  if (request.namespace) {
    $namespace =  new Namespace(request.namespace)
  }

  if (request.module) {
    $module = new Module(request.module)

    if (request.record) {
      $record = new Record($module, request.record)
    }
  }

  const ctx = {
    Record,
    Module,
    Namespace,

    Abort,

    $namespace,
    $module,
    $record,

    // @deprecated
    namespace: $namespace,

    // @deprecated
    module: $module,

    // @deprecated
    record: $record,
  }

  const { JWT } = request

  // Setup REST API handlers for the context (ctx)
  if (restAPI) {
    restAPI.compose.setJWT(JWT)
    restAPI.messaging.setJWT(JWT)
    restAPI.system.setJWT(JWT)
  }

  const $C = {
    api: {
      record: {
        async save (record) {
          if (!(record instanceof Record)) {
            throw Error('expecting Record type')
          }

          if ($record.recordID === record.recordID) {
            throw new Error(`refusing to execute save() on initiating record (ID: ${$record.recordID})`)
          }

          if (record.recordID === '') {
            return restAPI.compose.recordCreate(record).then(r => new Record(record.module, r))
          } else {
            return restAPI.compose.recordUpdate(record).then(r => new Record(record.module, r))
          }
        },

        async delete (record) {
          if (!(record instanceof Record)) {
            throw Error('expecting Record type')
          }

          if (record.recordID !== '') {
            return restAPI.compose.recordDelete(record)
          }
        },

        // Finds single or multiple records
        //
        // When recordID is passed as an filter property (or as filter!) a single record
        // lookup is performed
        //
        // Other cases run record finder, properties passed to moduleRecordList:
        //  - filter   string, SQL-where-like, simple comparison and boolean expressions
        //  - page     integer, page number, 1-based
        //  - perPage  integer, limit record per page
        //  - sort     string, SQL-order-like, comma separated fields with ASC/DESC for direction
        //
        //
        async find (module, filter = {}) {
          if (!(module instanceof Module)) {
            throw Error(`expecting Module type (got ${typeof module})`)
          }

          let params = {
            namespaceID: module.namespaceID,
            moduleID: module.moduleID,
          }

          // Extract recordID from filter param
          // Scenarios:
          //   - as recordID or ID property of filter object
          //   - filter as string
          params.recordID = (filter || {}).recordID || (filter || {}).ID || (typeof filter === 'string' && /^[0-9]+$/.test(filter) ? filter : undefined)
          if (params.recordID) {
            return restAPI.compose.recordRead(params).then((r) => {
              if (r.recordID === '0') {
                // @todo remove when backend starts returning 404 on nonexistent records
                return Promise.reject(Error('Record does not exists'))
              } else {
                return new Record(module, r)
              }
            })
          } else {
            if (typeof filter === 'string') {
              params.filter = filter
            } else if (typeof filter === 'object') {
              params = { ...params, ...filter }
            }

            return restAPI.compose.recordList(params).then(({ set, filter }) => {
              return { filter, records: (set || []).map(r => new Record(module, r)) }
            })
          }
        },
      },

      module: {
        async find (query) {
          const { namespaceID } = $namespace

          if (/^[0-9]+$/.test(query)) {
            return restAPI.compose.moduleRead({ namespaceID, moduleID: query }).then(m => {
              return new Module(m)
            })
          } else {
            return restAPI.compose.moduleList({ namespaceID, query }).then(({ set }) => {
              return set.length > 0 ? new Module(set[0]) : null
            })
          }
        },
      },

      user: {
        async find (keyword) {
          if (/^[0-9]+$/.test(keyword)) {
            return restAPI.system.userRead({ userID: keyword })
          } else {
            return restAPI.system.userList({ email: keyword }).then(({ set }) => {
              if (set.length > 0) {
                return set[0]
              } else {
                return null
              }
            })
          }
        },
      },
    },

    helpers: {
      record: {
        page: {
          reload: () => {
            console.warn('helpers.record.page.reload not implemented')
            // this.$emit('reload')
          },

          open: (record) => {
            console.warn('helpers.record.page.open not implemented')
            // if (!record) return
            // openRecordPage('page.record', record)
          },

          edit: (record) => {
            console.warn('helpers.record.page.edit not implemented')
            // if (!record) return
            // openRecordPage('page.record.edit', record)
          },
        },

        new: (module, values = {}) => {
          if (typeof module === 'string') {
            // Find from list of modules by name or ID
            module =  $C.api.module.find(module)
          }

          if (!(module instanceof Module)) {
            throw Error('expecting Module type')
          }

          let record = new Record(module)

          // Set record values
          for (let p in values) {
            record.values[p] = values[p]
          }

          return record
        },
      },
    },

    fmt: {
      record: {
        toHTML: (record) => {
          let rows = record.module.fields.map(f => {
            const v = record.values[f.name]
            return `<tr><td>${f.label || f.name}</td><td>${v || ''}</td></tr>`
          })

          return `<table>${rows.join('')}</table>`
        },
      },
    },

    notify: {
      send: {
        email: ({ to, cc = [], subject, html }) => {
          restAPI.compose.notificationEmailSend({
            to: Array.isArray(to) ? to : [to],
            cc: Array.isArray(cc) ? cc : [cc],
            subject,
            content: { html },
          }).then((m) => {
            this.raiseSuccessAlert(m)
          }).catch((m) => {
            this.raiseWarningAlert(m)
          })
        },
        message: ({ channelID }, message) => {
          restAPI.messaging.messageCreate({ channelID, message })
        },
      },

      ui: {
        alert: {
          success: (text) => {
            console.warn('helpers.ui.alert.success not implemented')
            // this.raiseSuccessAlert(text)
          },
          error: (text) => {
            console.warn('helpers.ui.alert.error not implemented')
            // this.raiseWarningAlert(text)
          },
        },
      },
    },
  }

  ctx.$C = $C

  // @deprecated
  // Backwards compatibility:
  // older scripts scripts used "crust" instead of $C
  ctx.crust = $C

  return ctx
}

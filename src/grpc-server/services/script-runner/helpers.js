import Record from '../../../types/record'
import Module from '../../../types/module'

// placeholders, to prevent eslint from complaning
// let $record, $module, $namespace

/**
 * Extracts ID-like (numeric) value from string or object
 *
 * @param {string|Object} value
 * @param key
 * @returns {*}
 */
export function extractID(value, key) {
  if (typeof value === 'object') {
    value = value[key]
  }

  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value !== 'string') {
    throw Error(`unexpected value type for ${key} type (got '${typeof value}', expecting string)`)
  }

  if (!/^[0-9]+$/.test(value)) {
    throw Error(`unexpected value format for ${key} type (got '${value}', expecting digits)`)
  }

  return value
}

export function findValidModule() {
  for (let module of arguments) {
    if (!module || typeof module !== 'object') {
      continue
    }

    if (module.set && module.filter) {
      // We got a result set with modules
      module = module.set
    }

    if (Array.isArray(module)) {
      // We got array of modules
      if (module.length === 0) {
        // Empty array
        continue
      } else {
        // Use first module from the list
        module = module.shift()
      }
    }

    if (!(module instanceof Module)) {
      // not module? is it an object with moduleID & namespaceID?
      if (module.moduleID === undefined || module.namespaceID === undefined) {
        break
      }

      return new Module(module)
    }

    return module
  }

  throw Error('unexpected value type for module type, ' +
    'expecting Module class or object with moduleID and namespaceID properties')
}

/**
 * Expecting at least one of the arguments to represent valid module struct
 *
 * @returns {{namespaceID: *, moduleID: *}}
 */
export function extractIDsFromModule() {
  const module = findValidModule.apply(this, arguments)

  const moduleID = extractID(module, 'moduleID')
      , namespaceID = extractID(module, 'namespaceID')

  return { moduleID, namespaceID }
}

export default (restAPI, {$namespace, $module, $record} = {}) => {
  return {
    /**
     * Makes a new record
     *
     * @param {Object} values
     * @param {Module} [module] - defaults to $module
     * @returns {Record}
     */
    MakeRecord: (values = {}, module) => {
      let record = new Record(module || $module)

      // Set record values
      record.setValues(values)

      return record
    },
    /**
     * Saves a record
     *
     * @param record
     * @param force
     * @returns {Promise<Record | *>}
     */
    SaveRecord: async (record, { force } = {}) => {
      if (!(record instanceof Record)) {
        throw Error('expecting Record type')
      }

      if (!force) {
        if (!record.recordID && $module.moduleID === record.module.moduleID) {
          throw new Error(`refusing to create initiating record (ID: ${record.recordID})`)
        }

        if ($record.recordID === record.recordID) {
          throw new Error(`refusing to update initiating record (ID: ${record.recordID})`)
        }
      }

      if (record.recordID === '') {
        return restAPI.compose.recordCreate(record).then(r => new Record(record.module, r))
      } else {
        return restAPI.compose.recordUpdate(record).then(r => new Record(record.module, r))
      }
    },

    /**
     * Deletes a record
     *
     * @param record
     * @param force
     * @returns {Promise<*>}
     */
    DeleteRecord: async (record, { force } = {}) => {
      if (!(record instanceof Record)) {
        throw Error('expecting Record type')
      }



      if (force) {
        if ($record.recordID === record.recordID) {
          throw new Error(`refusing to delete initiating record (ID: ${$record.recordID})`)
        }
      }

      if (record.recordID !== '') {
        return restAPI.compose.recordDelete(record)
      }
    },

    /**
     * Searches for records
     *
     * @param {string|Object} filter - record ID (when fully numeric string), filter query (when string) or filter object
     * @param {Module} [module] - fallbacks to filter.module and last, to $module
     * @returns {Promise<{filter: *, records: Record[]}>|Promise<*>}
     */
    FindRecords: async (filter, module = null) => {
      module = findValidModule(filter.module, module, $module)
      let params = extractIDsFromModule(module)

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
          params = {...params, ...filter}
        }

        return restAPI.compose.recordList(params).then((rval) => {
          // Casting all we got to to Record
          rval.set = rval.set.map(m => new Record(module, m))
          return rval
        })
      }
    },

    /**
     * Finds one record by ID
     *
     * @param {string|Object|Record}
     * @param {Module}
     * @returns {Promise<*>}
     */
    FindRecordByID: async (record, module = null) => {
      module = findValidModule(record.module || null, module, $module)
      return restAPI.compose.recordRead( {
        ...extractIDsFromModule(module),
        recordID: extractID(record, 'recordID'),
      }).then(r => new Record(module, r))
    },

    /**
     * Searches for modules
     * @param {string|Object} filter
     * @param {string|Namespace|Object} [namespace]
     * @returns {Promise<Promise<*>|Promise<Module | *>>}
     */
    FindModules: async (filter, namespace) => {
      if (typeof filter === 'string') {
        filter = { query: filter }
      }

      const namespaceID = extractID(namespace || $namespace , 'namespaceID')
      return restAPI.compose.moduleList({namespaceID, ...filter}).then(rval => {
        // Casting all we got to to Module
        rval.set = rval.set.map(m => new Module(m))
        return rval
      })
    },

    /**
     * Finds module by ID
     *
     * @param {string|Module|Object} module
     * @param {string|Namespace|Object} [namespace]
     * @returns {Promise<Module | *>}
     * @constructor
     */
    FindModuleByID: async (module, namespace = null) => {
      const moduleID = extractID(module, 'moduleID')
      const namespaceID = extractID(namespace || $namespace || module, 'namespaceID')

      return restAPI.compose.moduleRead({namespaceID, moduleID}).then(m => new Module(m))
    },

    /**
     * Searches for users
     *
     * @param filter
     * @returns {Promise<*>}
     */
    FindUsers: async (filter) => {
      if (typeof filter === 'string') {
        filter = { query: filter }
      }
      return restAPI.system.userList(filter).then(rval => {
        // @todo convert set array to []User
        return rval
      })
    },

    /**
     * Finds user by ID
     *
     * @param {userID|Object|User}
     * @returns {Promise<*>}
     */
    FindUserByID: async (user) => {
      // @todo convert to User obj
      return restAPI.system.userRead({...extractID(user, 'userID')})
    },

    /**
     * Sends email message
     *
     * @param to
     * @param subject
     * @param html
     * @param cc
     * @returns {Promise<void>}
     */
    SendEmail: async (to, subject, {html}, {cc = []}) => {
      restAPI.compose.notificationEmailSend({
        to: Array.isArray(to) ? to : [to],
        cc: Array.isArray(cc) ? cc : [cc],
        subject,
        content: {html},
      }).then((m) => {
        this.raiseSuccessAlert(m)
      }).catch((m) => {
        this.raiseWarningAlert(m)
      })
    },

    /**
     * Sends message to Corteza Messaging channel
     *
     * @param channel
     * @param message
     */
    SendMessageToChannel: async (channel, message) => {
      restAPI.messaging.messageCreate({
        ...extractID(channel, 'channelID'),
        message,
      })
    },

    /**
     * Sends direct message to Corteza Messaging user
     *
     * @todo Implementation
     *
     * @returns {Promise<void>}
     */
    SendDirectMessageToUser: async () => {
      throw Error('not implemented')
    },
  }
}

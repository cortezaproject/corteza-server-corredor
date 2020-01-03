/* eslint-disable @typescript-eslint/ban-ts-ignore */

// @ts-ignore
import ComposeApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/compose'
// @ts-ignore
import MessagingApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/messaging'
// @ts-ignore
import SystemApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/system'
// @ts-ignore
import ComposeHelper from 'corteza-webapp-common/src/lib/automation-scripts/context/compose'
// @ts-ignore
import MessagingHelper from 'corteza-webapp-common/src/lib/automation-scripts/context/messaging'
// @ts-ignore
import SystemHelper from 'corteza-webapp-common/src/lib/automation-scripts/context/system'
// @ts-ignore
import User from 'corteza-webapp-common/src/lib/system/user'

import { BaseArgs } from '../../types'
import { ExecConfig } from './types'

import { BaseLogger } from 'pino'

export interface ExecContextCtor {
    args: BaseArgs;
    log: BaseLogger;
    config: ExecConfig;
}

/**
 * Handles script execution context
 *
 *
 */
export class ExecContext {
    readonly args: BaseArgs;
    readonly config: ExecConfig;
    readonly log: BaseLogger;

    constructor ({ config, args, log }: ExecContextCtor) {
      this.args = args
      this.log = log
      this.config = config
    }

    /**
     * Alias for log, to make developer's life easier <3
     */
    get console (): BaseLogger {
      return this.log
    }

    /**
     * Returns promise with the current user (if jwt argument was given)
     *
     * @returns {Promise<User>}
     */
    get $authUser (): Promise<User> {
      return this.SystemAPI
        .authCheck()
        .then(({ user }: { user: User }) => user)
    }

    /**
     * Configures and returns system API client
     *
     * @returns {Promise<SystemApiClient>}
     */
    get SystemAPI (): SystemApiClient {
      return new SystemApiClient({
        baseURL: this.config.cServers.system.apiBaseURL,
        jwt: this.args.authToken
      })
    }

    /**
     * Configures and returns compose API client
     *
     * @returns {Promise<ComposeApiClient>}
     */
    get ComposeAPI (): ComposeApiClient {
      return new ComposeApiClient({
        baseURL: this.config.cServers.compose.apiBaseURL,
        jwt: this.args.authToken
      })
    }

    /**
     * Configures and returns messaging API client
     *
     * @returns {Promise<MessagingApiClient>}
     */
    get MessagingAPI (): MessagingApiClient {
      return new MessagingApiClient({
        baseURL: this.config.cServers.messaging.apiBaseURL,
        jwt: this.args.authToken
      })
    }

    /**
     * Configures and returns system helper
     *
     * @returns {SystemHelper}
     */
    get System (): SystemHelper {
      return new SystemHelper({ SystemAPI: this.SystemAPI, ...this.args })
    }

    /**
     * Configures and returns compose helper
     *
     * @returns {ComposeHelper}
     */
    get Compose (): ComposeHelper {
      return new ComposeHelper({ ComposeAPI: this.ComposeAPI, ...this.args })
    }

    /**
     * Configures and returns messaging helper
     *
     * @returns {MessagingHelper}
     */
    get Messaging (): MessagingHelper {
      return new MessagingHelper({ MessagingAPI: this.MessagingAPI, ...this.args })
    }
}

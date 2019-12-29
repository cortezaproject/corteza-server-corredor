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

import { Logger } from './logger'
import { ExecArgs } from './exec-args'
import { ExecConfig } from './d'
import { BaseArgs } from './corteza'

export interface ExecContextCtor {
    args: BaseArgs;
    log: Logger;
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
    private log: Logger;

    /**
     * @param {ExecContextCtor} ctx
     * @param {ExecConfig} ctx.config
     * @param {ExecArgs} ctx.args
     * @param {Logger} ctx.log
     */
    constructor ({ config, args, log }: ExecContextCtor) {
      this.args = args
      this.log = log
      this.config = config
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
        jwt: this.args.jwt
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
        jwt: this.args.jwt
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
        jwt: this.args
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

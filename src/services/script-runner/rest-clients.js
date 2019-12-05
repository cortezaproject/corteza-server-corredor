import ComposeApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/compose'
import MessagingApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/messaging'
import SystemApiClient from 'corteza-webapp-common/src/lib/corteza-server/rest-api-client/system'

export const Compose = (opt) => {
  return new ComposeApiClient(opt)
}

export const Messaging = (opt) => {
  return new MessagingApiClient(opt)
}

export const System = (opt) => {
  return new SystemApiClient(opt)
}

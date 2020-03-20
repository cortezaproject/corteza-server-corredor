import gRPC from 'grpc'
import * as Sentry from '@sentry/node'
import { BaseLogger } from 'pino'

/**
 * Parses stacktrace string into array of strings
 *
 * @param stack
 */
export function ParseStack (stack: string): string[] {
  return stack.split('\n')
  // Remove first line
    .slice(1)
  // Trim all lines and remove 'at ' prefix
    .map(l => l.trim().substring(3))
}

/**
 * Handle exceptions and prepare gRPC error payload
 */
export function HandleException (log: BaseLogger, err: Error, done: gRPC.sendUnaryData<null>, code: gRPC.status = gRPC.status.ABORTED): void {
  const { name, message, stack } = err
  const grpcErr: gRPC.ServiceError = {
    code,
    name,
    message,
  }

  if (code !== gRPC.status.ABORTED) {
    // Capture exception with sentry
    // but only for non-aborted codes
    Sentry.captureException(err)

    // Log exception
    log.debug({ stack, code }, message)

    if (stack) {
      const metadata = new gRPC.Metadata()
      ParseStack(stack).forEach(f => metadata.add('stack', f))
      grpcErr.metadata = metadata
    }
  }

  done(grpcErr, null)
}

import gRPC from "grpc";

/**
 * Parses stacktrace string into array of strings
 *
 * @param stack
 */
export function ParseStack(stack: string) : string[] {
    return stack.split("\n")
        // Remove first line
        .slice(1)
        // Trim all lines and remove 'at ' prefix
        .map(l => l.trim().substring(3))
}

/**
 * Handle exceptions and prepare gRPC error payload
 *
 * @param err
 * @param done
 * @constructor
 */
export function HandleException(err : Error, done : gRPC.sendUnaryData<null>) {
    const { name, message, stack } = err

    const grpcErr : gRPC.ServiceError = {
        code: gRPC.status.INTERNAL,
        name,
        message,
    }

    if (stack) {
        const metadata = new gRPC.Metadata()
        ParseStack(stack).forEach(f => metadata.add('stack', f))
        grpcErr.metadata = metadata
    }

    done(grpcErr, null)
}

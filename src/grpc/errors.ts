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
 * Standard exception handler
 *
 * @param stack
 * @param message
 * @param done
 */
export function HandleException({ stack, message }, done : gRPC.sendUnaryData<null>) {
    const metadata = new gRPC.Metadata()
    ParseStack(stack).forEach(f => metadata.add('stack', f))

    const err : gRPC.ServiceError = {
        code: gRPC.status.INTERNAL,
        message,

    }

    done(err, null, metadata)
}

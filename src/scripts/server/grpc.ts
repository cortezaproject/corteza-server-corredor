import gRPC, {ServiceError} from 'grpc'
import Service from "./service";
import {HandleException} from "../../grpc/errors";
import {gRPCServiceExecResponse, gRPCServiceListResponse} from "./d";

/**
 * Decodes exec arguments
 *
 * It assumes values of all properties in the
 * passed object are strings with encoded JSON
 *
 * @param {object} args
 * @returns {object} parsed arguments
 */
export function decodeExecArguments(args: object|undefined) : object {
    if (!args) {
        return {}
    }

    for (let k in args) {
        try {
            // @ts-ignore
            args[k] = JSON.parse(args[k])
        } catch (e) {
            throw new Error(`Could not parse argument ${k}: ${e}`)
        }
    }

    return args
}

export function encodeExecResult(args: object) : object {
    for (let k in args) {
        // @ts-ignore
        args[k] = JSON.stringify(args[k])
    }

    return args
}


export default function (h : Service) {
    return {
        Exec ({ request = {} } : any, done: gRPC.sendUnaryData<gRPCServiceExecResponse>) {
            // @ts-ignore
            const {name, args} = request;
            try {
                // Decode arguments
                // passed in as keys with JSON-encoded values
                const dArgs = decodeExecArguments(args)
                const { result, log } = h.Exec(name, dArgs)

                const meta = new gRPC.Metadata()

                // Map each log line from the executed function to the metadata
                log.forEach((l : string) => meta.add('log', l))

                done(null, { result: encodeExecResult(result) }, meta)
            } catch (e) {
                // @ts-ignore
                HandleException(e, done)
            }
        },

        List ({}, done: gRPC.sendUnaryData<gRPCServiceListResponse>) {
            try {
                const scripts = h.List()
                done(null, { scripts })
            } catch (e) {
                // @ts-ignore
                HandleException(e, done)
            }
        },
    }
}

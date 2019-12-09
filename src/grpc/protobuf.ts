import path from "path";
import grpc from "grpc";
import {PackageDefinition} from "@grpc/proto-loader";

const protoLoader = require('@grpc/proto-loader');

export function LoadDefinitions(protobuf : string) : Promise<grpc.PackageDefinition> {
    return protoLoader.load(
        path.join(protobuf),
        {})
        .then((def: PackageDefinition) => grpc.loadPackageDefinition(def))
}

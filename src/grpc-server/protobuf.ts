import path from 'path'
import grpc from 'grpc'
import * as protoLoader from '@grpc/proto-loader'

export function LoadDefinitions (protobuf: string): Promise<grpc.PackageDefinition> {
  return protoLoader.load(
    path.join(protobuf),
    {})
    .then((def: protoLoader.PackageDefinition) => grpc.loadPackageDefinition(def))
}

import grpc from 'grpc'
import { Trigger } from './trigger'
import { corredor as exec } from '@cortezaproject/corteza-js'

export interface ScriptFn {
  (args: exec.Args, ctx?: exec.Ctx): unknown;
}

export interface ScriptSecurity {
  runAs?: string;
  deny: string[];
  allow: string[];
}

export interface Script {
  filepath: string;
  name: string;
  label?: string;
  description?: string;
  security?: ScriptSecurity;
  triggers?: Trigger[];
  exec?: ScriptFn;
  errors?: string[];
  updatedAt?: Date;
}

/**
 * Filters and reduces list of script and returns yungest one
 *
 * @param {Array<{ updatedAt?: Date }>} scripts
 * @param {Date}                        fallback
 * @return {Date} latest updatedAt from the array of scripts
 */
export function GetLastUpdated (scripts: Array<{ updatedAt?: Date }>, fallback = new Date('0000-01-01')): Date {
  return scripts
    .map(({ updatedAt }) => updatedAt)
    .filter(updatedAt => updatedAt)
    .reduce((last, updatedAt) => {
      return last < updatedAt ? updatedAt : last
    }, fallback)
}

/**
 * Compares if-modified-since value from grpc headers (metadata) with the given date
 *
 * It silently ignores invalid dates from metadata
 *
 * @param {Date} lastModified
 * @param {grpc.Metadata} metadata
 * @return {boolean}
 */
export function IsModifiedSince (lastModified: Date, metadata: grpc.Metadata): boolean {
  const imsMD = metadata.get('if-modified-since')
  if (imsMD.length === 0) {
    return true
  }

  const imd = Date.parse(imsMD[0].toString())
  return isNaN(imd) || lastModified > new Date(imd)
}

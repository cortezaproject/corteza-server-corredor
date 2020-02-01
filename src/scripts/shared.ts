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
  // Script location
  filepath: string;

  // Script reference, used by exec
  name: string;

  // Display friendly script name
  label?: string;

  // Description of a script, lorem ipsum
  description?: string;

  // Security settings,
  // run-as settings and simplifed RBAC (lit of roles that are allowed/denied to execute the script)
  //
  // run-as:
  //   [C] ignored
  //   [S] enforced
  //
  // deny/allow:
  //   [C] used for filtering (who can see what) but ignored
  //   [S] enforced for manual scripts, ignored for implicit
  //
  security?: ScriptSecurity;

  // When & what trigger this script
  triggers?: Trigger[];

  // Code (function) to be executed
  exec?: ScriptFn;

  // Errors detected when loading script
  errors?: string[];

  // File modification time
  updatedAt?: Date;

  // Script bundle
  bundle?: string;
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

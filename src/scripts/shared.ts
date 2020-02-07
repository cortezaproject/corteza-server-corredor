import grpc from 'grpc'
import { Trigger } from './trigger'
import { ScriptFn, ScriptSecurity } from './types'

export interface ScriptFile {
  // Script location
  src: string;

  // File modification time
  updatedAt: Date;

  // Errors detected when requiring the script
  errors?: string[];

  // Client script bundle
  bundle?: string;
}

export interface Script extends ScriptFile {
  // Script reference, used by exec
  name: string;

  // Display friendly script name
  label?: string;

  // Description of a script, lorem ipsum
  description?: string;

  // Security settings,
  // run-as settings and simplified RBAC (list of roles that are allowed/denied to execute the script)
  //
  // run-as:
  //   For client scripts: ignored
  //   For server scripts: enforced
  //
  // deny/allow:
  //   For client scripts: used for filtering (who can see what) but ignored
  //   For server scripts: enforced for manual scripts, ignored for implicit
  //
  security?: ScriptSecurity;

  // When & what trigger this script
  triggers?: Trigger[];

  // Code (function) to be executed
  exec?: ScriptFn;

  // Name of the exported symbol (default, ...)
  exportName?: string;
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

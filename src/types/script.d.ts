import { ComposeModuleArgs, ComposeRecordArgs, ExecContext, Result } from './corteza'
import { Trigger } from '../scripts/trigger'

type ExecArgs = ComposeRecordArgs | ComposeModuleArgs

export declare interface ScriptDef {
  label: string;
  description?: string;
  triggers?: Trigger[];
  exec(args?: ExecArgs, ctx?: ExecContext): Result;
  exec(args?: ExecArgs, ctx?: ExecContext): Promise<Result>;
}

import Namespace from 'corteza-webapp-common/src/lib/types/compose/namespace'
import Module from 'corteza-webapp-common/src/lib/types/compose/module'
import Record from 'corteza-webapp-common/src/lib/types/compose/record'

export class ExecArgs {
    private args : Map<string, any>

    constructor(args : object) {
        this.args = new Map()

        let arg : string;
        for (arg in args) {
            if (this.hasOwnProperty(arg)) {
                // We have our own getter to handle this

                // @ts-ignore
                this.args.set(arg, args[arg])
                continue
            }

            Object.defineProperty(this, arg, {
                // @ts-ignore
                value: args[arg],
                writable: false,
                enumerable: true,
            });
        }
    }

    /**
     * Current record
     *
     * @returns {Record|undefined}
     */
    get $record () : Record|undefined {
        if (!this.args.has('$record')) {
            return undefined
        }

        return new Record(
            this.args.get('$record'),
            this.args.has('$module'),
        );
    }

    /**
     * Current module
     *
     * @returns {Module|undefined}
     */
    get $module () : Module|undefined {
        if (!this.args.has('$module')) {
            return undefined
        }

        return new Module(this.args.get('$module'))
    }

    /**
     * Current namespace
     *
     * @returns {Namespace|undefined}
     */
    get $namespace () : Namespace|undefined {
        if (!this.args.has('$namespace')) {
            return undefined
        }

        return new Namespace(this.args.get('$namespace'))
    }
}

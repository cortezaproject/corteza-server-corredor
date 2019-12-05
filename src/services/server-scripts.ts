import {ServerScripts} from "../server-scripts";

export default function (h : ServerScripts) {
    return {
        Exec ({ request: { name, context } }, done) {
            try {
                h.Exec(name, context)
                done(null, {})
            } catch (e) {
                console.error(e)
                done(e)
            }
        },

        List ({ request: {} }, done) {
            try {
                const scripts = h.List()
                done(null, { scripts })
            } catch (e) {
                console.error(e)
                done(e)
            }
        },
    }
}

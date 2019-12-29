import { Trigger } from '.'

export function parseDSL (str: string): Trigger {
  throw new Error('DSL parsing not implemented')
  // DSL Examples:
  /*
   * @trigger afterUpdate
   *      and afterDelete
   *      for compose:record
   *       as 'someuser'                  # <- optional, run-as (handle, email)
   *     when module    = 'fooHandle'     # <- optional conditions
   *      and namespace = 'barHandle'     #
   *
   *  @trigger manually                    # <- explicitly define when script can be triggered manually
   *                                      #    we need to build an endpoint that serves list of manual triggers
   *                                      #    so users can bind them to UI buttons
   *       as 'someuser'                  # <- optional, run-as (handle, email)
   *     when module    = 'fooHandle'     # <- optional conditions
   *      and namespace = 'barHandle'     #
   *
   * @trigger onRequest
   *      for system:sink
   *       as 'someuser'                  # <- optional, run-as (handle, email)
   *     when method = 'POST'             # <- optional conditions
   *      and path = 'bar/baz'            #
   *      and post[foo] = 'bar'           #
   *
   * @trigger onReceive
   *      for system:mail
   *       as sender                      # <- required, run-as from variable
   *     when from ~= /@crust\.tech$/     # <- optional conditions, supporting only AND operator
   *      and subject = 'Question'        #
   *
   * @trigger onTimestamp
   *       as someuser                    # <- required
   *       at 2020-01-01 00:00:00         # <- required conditions, supporting only AND operator
   *      and 2021-01-01 00:00:00
   *
   * @trigger onInterval
   *       as someuser                    # <- required
   *    every * * * * *                   # <- cron interval format
   */
}

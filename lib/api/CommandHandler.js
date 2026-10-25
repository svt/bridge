// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class CommandHandler {
  /**
   * Create a new handler
   * @param { HandlerFunction } handlerFn The handler's function
   * @param { String } owner The owner of the handler
   * @param { Object } [metadata]
   */
  constructor (handlerFn, owner, metadata) {
    /**
     * @readonly
     * @type { HandlerFunction }
     */
    this.call = handlerFn

    /**
     * @readonly
     * @type { String }
     */
    this.owner = owner

    /**
     * Commands are not exposed unless explicitly opted in
     * @readonly
     * @type {{ description: String, args: Object | undefined, exposed: Boolean }}
     */
    this.metadata = {
      description: typeof metadata?.description === 'string' ? metadata.description : '',
      args: metadata?.args && typeof metadata.args === 'object' ? metadata.args : undefined,
      exposed: metadata?.exposed === true
    }
  }
}
module.exports = CommandHandler

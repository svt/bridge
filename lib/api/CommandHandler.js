/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 *
 * @typedef { (...any) => Promise.<any> || (...any) => Void } HandlerFunction
 */

class CommandHandler {
  /**
   * Create a new command handler
   * @param { String } owner The owner of the handler
   * @param { HandlerFunction } handlerFn The handler's function
   */
  constructor (handlerFn, owner) {
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
  }
}
module.exports = CommandHandler

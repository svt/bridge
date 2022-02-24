// SPDX-FileCopyrightText: 2022 Sveriges Television AB

//
// SPDX-License-Identifier: MIT

class Handler {
  /**
   * Create a new handler
   * @param { HandlerFunction } handlerFn The handler's function
   * @param { String } owner The owner of the handler
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
module.exports = Handler

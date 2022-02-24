// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const merge = require('./merge')
const EventEmitter = require('events')

/**
 * @class State
 * @description The state holds data as a patchable JSON-object
 *              which is accessed through the websocket api.
 *              Changes can be subscribed to using events.
 */
class State extends EventEmitter {
  /**
   * Get the singleton instance
   * of this class
   * @returns { State }
   */
  static getInstance () {
    if (!this._instance) {
      this._instance = new State()
    }
    return this._instance
  }

  /**
   * Get the data stored
   * in this state
   * @type { Object }
   */
  get data () {
    return this._data
  }

  constructor () {
    super()
    /**
     * @private
     */
    this._data = {}
  }

  /**
   * Clear the state
   */
  clear () {
    this._data = {}
    this.apply({})
  }

  /**
   * Apply some data to the state,
   * will trigger the change-event
   * @param { Object } set Any data to apply to the state
   * @param { Object } transparent An optional transparent value
   *                               to include in the event
   */
  apply (set, transparent) {
    merge.deep(this._data, set)
    this._data.time = Date.now()
    this.emit('change', this._data, transparent)
  }

  /**
   * Teardown the state
   * and remove all listeners
   */
  teardown () {
    this.removeAllListeners('change')
  }
}

module.exports = State

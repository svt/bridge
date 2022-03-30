// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const merge = require('../shared/merge')

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

  /**
   * Get the state's
   * current revision number
   * @type { Number }
   */
  get revision () {
    return this._data._revision
  }

  constructor () {
    super()
    /**
     * @private
     */
    this._data = {
      _revision: 0
    }
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

    if (this._data._revision === Number.MAX_SAFE_INTEGER) {
      this._data._revision = 0
    } else {
      this._data._revision += 1
    }

    this._data.time = Date.now()
    this.emit('change', set, transparent)
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

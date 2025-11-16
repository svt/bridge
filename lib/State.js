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

  constructor (initialData = {}) {
    super()
    /**
     * @private
     */
    this._data = {
      _revision: 0,
      ...initialData
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
   * Check if a key is
   * considered temporary
   * @param { string } key
   * @returns { boolean }
   */
  #isTemporaryKey (key) {
    if (typeof key !== 'string') {
      return false
    }
    return key[0] === '_'
  }

  /**
   * Check if the object to be set
   * includes any top level properties
   * not preceeded with an underscore '_'
   *
   * All keys without an underscore are
   * considered persistent changes
   *
   * @param { any } set
   * @returns { boolean }
   */
  #isChangingPersistentProperties (set) {
    for (const key of Object.keys(set)) {
      if (!this.#isTemporaryKey(key)) {
        console.log('Change key', key)
        return true
      }
    }
    return false
  }

  /**
   * Apply some data to the state,
   * will trigger the change-event
   * @param { Object } set Any data to apply to the state
   * @param { Object } transparent An optional transparent value
   *                               to include in the event
   *//**
   * Apply multiple data objects to the state in order,
   * will trigger the change-event
   * @param { Object[] } set An array of data objects
   *                         to apply to the state
   * @param { Object } transparent An optional transparent value
   *                               to include in the event
   */
  apply (set, transparent) {
    let changesArr = set
    if (!Array.isArray(set)) {
      changesArr = [set]
    }

    for (const change of changesArr) {
      merge.deep(this._data, change)

      /*
      Determine if the applied change is
      changing any non temporary properties,

      that is, a key not preceeded by '_'

      if this is true, the _hasUnsavedChanges property
      is set to true, allowing the user interface
      to react and show the document as unsaved
      */
      if (
        !this._data._hasUnsavedChanges &&
        this.#isChangingPersistentProperties(change)
      ) {
        change._hasUnsavedChanges = true
        this._data._hasUnsavedChanges = true
      }
    }

    if (this._data._revision === Number.MAX_SAFE_INTEGER) {
      this._data._revision = 0
    } else {
      this._data._revision += 1
    }

    this._data.time = Date.now()
    this.emit('change', set, transparent)
  }

  /**
   * Get a static representation
   * of the state, that is, without
   * any temporary keys (those starting with _)
   *
   * This string is suitable for
   * storing the state externally
   *
   * @returns { String }
   */
  toStaticString () {
    const out = {}
    Object.keys(this.data)
      .filter(key => !this.#isTemporaryKey(key))
      .forEach(key => { out[key] = this.data[key] })

    return JSON.stringify(out)
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

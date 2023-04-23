// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class CasparManager {
  constructor () {
    /**
     * @private
     * @type { Map.<String, Caspar> }
     */
    this._index = new Map()
  }

  /**
   * Add a new Caspar server
   * to this manager
   * @param { String } id
   * @param { Caspar } caspar
   */
  add (id, caspar) {
    this._index.set(id, caspar)
  }

  /**
   * Remove a server from the
   * manager by its id
   * @param { String } id
   */
  remove (id) {
    this._index.delete(id)
  }

  /**
   * Get a server from the
   * manager by its id
   * @param { String } id
   * @returns { Caspar? }
   */
  get (id) {
    return this._index.get(id)
  }
}
module.exports = CasparManager

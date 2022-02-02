/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const fs = require('fs')
const crypto = require('crypto')

class StaticFileRegistry {
  /**
   * Get the singleton
   * instance of this class
   * @returns { StaticFileRegistry }
   */
  static getInstance () {
    if (!this._instance) this._instance = new StaticFileRegistry()
    return this._instance
  }

  constructor () {
    /**
     * @private
     */
    this._map = new Map()
  }

  /**
   * Get a read stream
   * for a file with an id
   * @param { String } id
   * @returns { ReadableStream }
   */
  createReadStream (id) {
    const path = this._map.get(id)
    if (!path) return

    return fs.createReadStream(path)
  }

  /**
   * Start serving the file at an absolute path
   * @param { import('fs').PathLike } path
   * @returns { String } An identifier for the file
   */
  serve (path) {
    const hash = crypto.createHash('sha256')
    const id = hash.update(path).digest('hex')

    this._map.set(id, path)
    return id
  }
}
module.exports = StaticFileRegistry
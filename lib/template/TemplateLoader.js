// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')

const Logger = require('../Logger')
const logger = new Logger({ name: 'TemplateLoader' })

class TemplateLoader {
  /**
   * Get the singleton
   * instance of this class
   * @returns { TemplateLoader }
   */
  static getInstance () {
    if (!this._instance) {
      this._instance = new TemplateLoader()
    }
    return this._instance
  }

  constructor (path) {
    /**
     * @private
     * @type { String }
     */
    this._path = path
  }

  /**
   * Set the directory path for this
   * loader to look for templates in
   * @param { String } dirpath
   */
  setPath (dirpath) {
    this._path = dirpath
  }

  /**
   * List all available templates
   */
  async list () {
    if (!this._path) {
      throw new Error('No template path is set')
    }

    logger.debug('Listing templates in directory', this._path)
    const files = fs.promises.readdir(this._path)
    console.log(files)
  }
}
module.exports = TemplateLoader

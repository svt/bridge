// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')

const InvalidArgumentError = require('../error/InvalidArgumentError')

class Clipboard {
  /**
   * Write a string into the clipboard
   * @param { String } str A string to write
   * @returns { Promise.<boolean> }
   */
  writeText (str) {
    if (typeof str !== 'string') {
      throw new InvalidArgumentError('Provided text is not a string and cannot be written to the clipboard')
    }

    return navigator.clipboard.writeText(str)
  }

  /**
   * Read a string stored in the clipboard,
   * will return an empty string
   * if the clipboard is empty
   * @returns { Promise.<string> }
   */
  readText () {
    return navigator.clipboard.readText()
  }

  /**
   * Read the contents of the clipboard as a json object,
   * will return undefined if unable to parse the data
   * @returns { Promise.<object?> }
   */
  async readJson () {
    try {
      const str = await this.readText()
      return JSON.parse(str)
    } catch (_) {
      return undefined
    }
  }
}

DIController.main.register('Clipboard', Clipboard)

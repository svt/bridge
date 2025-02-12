// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const objectPath = require('object-path')

const DIController = require('../shared/DIController')

/**
 * The regex used to match
 * variables in strings
 *
 * @example
 * "My string $(my_variable)" -> MATCH
 * "My string no variable" -> NO MATCH
 *
 * This should NOT be made global "/g" as that will trigger
 * an issue where the expression will only match every
 * other time it's used – this is known behaviour in
 * multiple browsers
 *
 * @type { RegExp }
 */
const VARIABLE_REGEX = /\$\((.*?)\)/

class Variables {
  #props

  constructor (props) {
    this.#props = props
  }

  /**
   * Check if a string contains
   * at least one variable
   * @param { String } str
   * @returns { Boolean }
   */
  stringContainsVariable (str) {
    if (typeof str !== 'string') {
      return false
    }
    return VARIABLE_REGEX.test(str)
  }

  /**
   * Set a variable's value
   * @param { String } key
   * @param { any } value
   */
  setVariable (key, value) {
    return this.#props.Commands.executeCommand('variables.setVariable', key, value)
  }

  /**
   * Get a variable's value
   * @param { String } key
   * @returns { Promise.<any> }
   */
  getVariable (key) {
    return this.#props.Commands.executeCommand('variables.getVariable', key)
  }

  /**
   * Get all variables' values
   * @returns { Promise.<any> }
   */
  async getAllVariables () {
    return this.#props.State.get('variables')
  }

  /**
   * Substitute variables for their
   * values in a string
   *
   * @example
   * "Hello $(my variable)" -> "Hello world"
   *
   * @param { String } str
   * @param { any } data          Data to substitute variables for,
   *                              defaults to the local this.#props.State
   * @param { any } overrideData  Data that will override the
   *                              default data rather than replace
   * @returns { String }
   */
  substituteInString (str, data = (this.#props.State.getLocalState()?.variables || {}), overrideData = {}) {
    if (!str) {
      return ''
    }

    const text = `${str}`.split(VARIABLE_REGEX)
    const values = {
      ...data,
      ...overrideData
    }

    let out = ''
    let i = 0

    while (text.length > 0) {
      if (i % 2 === 0) {
        out += text.shift()
      } else {
        const path = text.shift()
        const value = objectPath.get(values, path)
        out += value || ''
      }
      i++
    }
    return out
  }
}

DIController.main.register('Variables', Variables, [
  'State',
  'Commands'
])

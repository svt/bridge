// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const objectPath = require('object-path')

const DIController = require('../shared/DIController')

const VARIABLE_REGEX = /\$\((.*?)\)/g

class Variables {
  #props

  constructor (props) {
    this.#props = props
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
    const text = str.split(VARIABLE_REGEX)
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

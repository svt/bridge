// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  setVariable: Function.<Promise.<Boolean>>,
 *  getVariable: Function.<Promise.<any>>
 * }} VariablesApi
 */

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SVariables extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('variables.setVariable', this.setVariable.bind(this))
    this.props.SCommands.registerAsyncCommand('variables.getVariable', this.getVariable.bind(this))
  }

  /**
   * Set a variable to a certain value
   * @param { String } key The variable name to set
   * @param { String } value The variable value to set
   * @returns { Promise.<Boolean> }
   */
  setVariable (key, value) {
    this.props.SState.applyState({
      variables: {
        [key]: value
      }
    })
    return Promise.resolve(true)
  }

  /**
   * Get the value of a variable
   */
  getVariable (key) {
    return {
      value: this.props.Workspace.state.data?.variables?.[key]
    }
  }
}

DIController.main.register('SVariables', SVariables, [
  'Workspace',

  'SCommands',
  'SState'
])

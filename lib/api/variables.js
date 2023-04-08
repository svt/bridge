// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  setVariable: Function.<Promise.<Boolean>>,
 *  getVariable: Function.<Promise.<any>>
 * }} VariablesApi
 */

/**
 * A factory function
 * for the variables API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * @type { VariablesApi }
   */
  api.variables = {}

  /**
   * Set a variable to a certain value
   * @param { String } key The variable name to set
   * @param { String } value The variable value to set
   * @returns { Promise.<Boolean> }
   */
  function setVariable (key, value) {
    workspace.state.apply({
      variables: {
        [key]: value
      }
    })
    return Promise.resolve(true)
  }
  
  /**
   * Get the value of a variable
   */
  function getVariable (key) {
    return workspace.state.data?.variables?.[key]
  }
  
  api.variables.setVariable = setVariable
  api.variables.getVariable = getVariable
  api.commands.registerAsyncCommand('variables.setVariable', setVariable)
  api.commands.registerAsyncCommand('variables.getVariable', getVariable)
}
exports.factory = factory

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const objectPath = require('object-path')

/**
 * A factory function
 * for the state API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * Apply some arbitrary
   * data to the state
   *
   * This function only exists
   * to run the apply function
   * the correct scope
   * @param { Object } set Some data to set
   */
  function applyState (set) {
    workspace.state.apply(set)
  }
  api.commands.registerCommand('state.apply', applyState)

  /**
   * Get the current
   * full state or part
   * of the state using a
   * dot-notation path
   * @param { String } path An optional path for only
   *                        getting part of the state
   * @returns { any }
   *//**
   * Get the full state
   * @returns { any }
   */
  function getState (path) {
    const data = workspace.state.data
    if (path) {
      return objectPath.get(data, path)
    }
    return data
  }
  api.commands.registerAsyncCommand('state.get', getState)
}
exports.factory = factory

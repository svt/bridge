/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

/**
 * A factory function
 * for the server API
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
}
exports.factory = factory

// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * A factory function
 * for the settings API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  function heartbeat (connectionId) {
    workspace.state.apply({
      _connections: {
        [connectionId]: { heartbeat: Date.now() }
      }
    })
  }
  api.commands.registerCommand('client.heartbeat', heartbeat)
}
exports.factory = factory

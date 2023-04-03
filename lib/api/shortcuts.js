// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 * }} ShortcutsApi
 */

/**
 * A factory function
 * for the settings API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * @type { ShortcutsApi }
   */
  api.shortcuts = {}

  /**
   */
  function getShortcut (id) {
    return {}
  }
  api.shortcuts.getShortcut = getShortcut
  api.commands.registerAsyncCommand('shortcuts.getShortcut', getShortcut)
}
exports.factory = factory

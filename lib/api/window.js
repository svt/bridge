// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @file Implements the window API
 * @description This API is INTERNAL and may change anytime,
 *              it is not meant to be used by plugin developers
 *
 * @typedef {{
 *  toggleMaximize: Function.<Promise.<Boolean>>
 * }} WindowApi
 */

const platform = require('../platform')
const electronWindowManager = require('../electronWindowManager')

/**
 * A factory function
 * for the window API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * @type { WindowApi }
   */
  api.window = {}

  /*
  Skip initializing the API if we're
  not running inside Electron as this API
  is only for application windows
  */
  if (!platform.isElectron()) {
    return
  }

  /**
   * Toggle the maximized state of the window
   * currently hosting the workspace
   * @returns { Promise.<Boolean> }
   */
  async function toggleMaximize () {
    const window = await electronWindowManager.getWindowFromWorkspace(workspace.id)
    if (!window) {
      return false
    }

    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
    return true
  }

  api.window.toggleMaximize = toggleMaximize
  api.commands.registerAsyncCommand('window.toggleMaximize', toggleMaximize)
}
exports.factory = factory

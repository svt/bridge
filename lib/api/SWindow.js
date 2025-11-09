// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @file Implements the window API
 * @description This API is INTERNAL and may change anytime,
 *              it is not meant to be used by plugin developers
 */

const electron = require('electron')
const { initStatelessWindow } = require('../electron/electron.js')
const windowManagement = require('../electron/windowManagement.js')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SWindow extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('window.openExternal', this.openExternal.bind(this))
    this.props.SCommands.registerAsyncCommand('window.toggleMaximize', this.toggleMaximize.bind(this))
    this.props.SCommands.registerAsyncCommand('window.openChildWindow', this.openChildWindow.bind(this))
  }

  /**
   * Toggle the maximized state of the window
   * currently hosting the workspace
   * @returns { Promise.<Boolean> }
   */
  async toggleMaximize () {
    const window = await windowManagement.getWindowFromWorkspace(this.props.Workspace.id)
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

  openExternal (url) {
    return electron.shell.openExternal(url)
  }

  async openChildWindow (url) {
    const child = initStatelessWindow(url, {
      width: 600,
      height: 400
    })
    this.props.Workspace.props.WindowStore.addWindow(child)
  }
}

DIController.main.register('SWindow', SWindow, [
  'Workspace',
  'SCommands'
])

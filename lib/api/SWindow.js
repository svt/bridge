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

const InvalidArgumentError = require('../error/InvalidArgumentError.js')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SWindow extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('window.openChildWindow', this.openChildWindow.bind(this))
    this.props.SCommands.registerAsyncCommand('window.openExternal', this.openExternal.bind(this))
    this.props.SCommands.registerCommand('window.setControlColors', this.setControlColors.bind(this))
    this.props.SCommands.registerCommand('window.toggleMaximize', this.toggleMaximize.bind(this))
    this.props.SCommands.registerCommand('window.minimize', this.minimize.bind(this))
    this.props.SCommands.registerCommand('window.close', this.close.bind(this))
  }

  /**
   * Toggle the maximized state of the window
   * currently hosting the workspace
   * @returns { Promise.<Boolean> }
   */
  async toggleMaximize (id) {
    if (!id) {
      return
    }

    const window = await this.props.Workspace.props.WindowStore.getWindow(id)
    if (!window) {
      return false
    }

    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  }

  async minimize (id) {
    if (!id) {
      return
    }

    const window = await this.props.Workspace.props.WindowStore.getWindow(id)
    if (!window) {
      return false
    }

    if (window.minimizable) {
      window.minimize()
    }
  }

  async close (id) {
    if (!id) {
      return
    }

    const window = await this.props.Workspace.props.WindowStore.getWindow(id)
    if (!window) {
      return false
    }

    if (window.closable) {
      window.close()
    }
  }

  async setControlColors (id, colors) {
    if (!id) {
      return
    }

    const window = await this.props.Workspace.props.WindowStore.getWindow(id)
    if (!window) {
      return false
    }

    if (typeof colors.symbolColor !== 'string') {
      throw new InvalidArgumentError('Invalid or missing property symbolColor')
    }

    /*
    Make sure that the function is set within Electron,
    it isn't for macOS e.t.c.
    */
    if (typeof window?.setTitleBarOverlay !== 'function') {
      return
    }

    window.setTitleBarOverlay({
      color: '#00000000',
      symbolColor: colors.symbolColor
    })
  }

  openExternal (url) {
    return electron.shell.openExternal(url)
  }

  async openChildWindow (url) {
    const id = this.props.Workspace.props.WindowStore.getNewWindowId()
    const child = initStatelessWindow(url, {
      width: 600,
      height: 400
    }, { workspace: this.props.Workspace, windowId: id })
    this.props.Workspace.props.WindowStore.addWindow(id, child)
  }
}

DIController.main.register('SWindow', SWindow, [
  'Workspace',
  'SCommands',
  'SEvents'
])

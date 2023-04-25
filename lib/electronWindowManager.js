// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { BrowserWindow } = require('electron')
const utils = require('./utils')

/**
 * Get the window currently hosting
 * a workspace by the workspace's id
 * @param { String } workspaceId The id of the workspace to look for
 * @returns { Promise.<BrowserWindow | undefined> }
 */
async function getWindowFromWorkspace (workspaceId) {
  const windows = BrowserWindow.getAllWindows()

  const promises = windows.map(window => {
    const a = window.webContents.executeJavaScript('window?.APP?.workspace')
    /*
    This is racing the execution
    against a timeout in order
    to not get stuck if the
    execution doesn't resolve or reject (for some reason)

    This should probably be
    changed to something better
    */
    const b = utils.wait(100)
    return Promise.race([a, b])
      .then(workspaceId => ([workspaceId, window]))
  })

  /**
   * @type { ([String | Boolean, BrowserWindow])[] }
   */
  const windowTouples = await Promise.all(promises)

  for (const touple of windowTouples) {
    if (touple[0] === workspaceId) {
      return touple[1]
    }
  }
}
exports.getWindowFromWorkspace = getWindowFromWorkspace

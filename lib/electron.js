// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { app, BrowserWindow, Menu } = require('electron')

/**
 * The template for
 * the application menu
 *
 * For further documentation
 * see the electron website
 *
 * @see https://www.electronjs.org/docs/latest/api/menu
 * @type { Object }
 */
const MENU_TEMPLATE = [
  { role: 'appMenu' },
  {
    label: 'File',
    submenu: [
      {
        label: 'New window',
        /**
         * @todo
         * Fetch the port dynamically
         */
        click: () => initWindow('http://localhost:3000')
      }
    ]
  },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
  { role: 'helpMenu' }
]

/**
 * The Electron app object
 * @type { import('electron').App }
 */
exports.app = app

const isReady = (function () {
  let hasLoaded = false

  /**
   * Await the app to be loaded,
   * will return immediately if called
   * multiple times
   * @returns { Promise.<Boolean> }
   */
  return async function () {
    if (hasLoaded) return true

    return new Promise(resolve => {
      app.once('ready', () => {
        hasLoaded = true
        resolve()
      })
    })
  }
})()
exports.isReady = isReady

/**
 * Check if the process is running
 * in an environment that is
 * compatible with Electron
 * @returns { Boolean } True if the process is
 *                      compatible with Electron
 */
function isCompatible () {
  return process.versions.electron != null
}
exports.isCompatible = isCompatible

/**
 * Initialize a new
 * window loading a url
 * @param { String } url A url to load in the window
 */
function initWindow (url) {
  const opts = {
    width: 1280,
    height: 720,
    minWidth: 560,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: 'black',
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webviewTag: false
    }
  }

  if (process.env.NODE_ENV === 'development') {
    opts.webPreferences.webSecurity = false
  }

  const window = new BrowserWindow(opts)

  window.loadURL(url, {
    /*
    The user agent string might be used to identify
    the context within the renderer code
    */
    userAgent: `Bridge/${process.env.npm_package_version}`
  })
}
exports.initWindow = initWindow

/*
Build and activate
the application menu
if we're currently running
in Electron
*/
;(function () {
  if (!isCompatible()) return
  const menu = Menu.buildFromTemplate(MENU_TEMPLATE)
  Menu.setApplicationMenu(menu)
})()

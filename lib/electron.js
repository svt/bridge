/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const { app, BrowserWindow } = require('electron')

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
      contextIsolation: false,
      enableRemoteModule: false,
      nodeIntegration: true,
      webviewTag: true
    }
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

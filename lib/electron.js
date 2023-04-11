// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const {
  app,
  Menu,
  BrowserWindow,
  dialog,
  powerMonitor,
  powerSaveBlocker
} = require('electron')

const platform = require('./platform')

const ProjectFile = require('./ProjectFile')
const UserDefaults = require('./UserDefaults')
const WorkspaceRegistry = require('./WorkspaceRegistry')

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
        label: 'New workspace',
        accelerator: 'CommandOrControl+N',
        click: () => initWindow(`http://localhost:${UserDefaults.data.httpPort}`)
      },
      {
        label: 'Open',
        accelerator: 'CommandOrControl+O',
        click: () => openWithDialog(initWindow())
      },
      {
        label: 'Open Recent',
        role: 'recentdocuments',
        submenu: [
          {
            label: 'Clear Recent',
            role: 'clearrecentdocuments'
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Save',
        accelerator: 'CommandOrControl+S',
        click: () => save(BrowserWindow.getFocusedWindow())
      },
      {
        label: 'Save as',
        accelerator: 'CommandOrControl+Shift+S',
        click: () => saveAs(BrowserWindow.getFocusedWindow())
      }
    ]
  },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
  { role: 'helpMenu' }
]

/**
 * @private
 *
 * THIS IS ONLY TO BE USED
 * BY THE HANDLERS CALLED WHEN
 * OPENING THE APP WITH A FILE
 *
 * @type { Boolean }
 */
let _wasOpenedByFile = false

/**
 * Returns true if the app
 * was opened using a file
 * @returns { Boolean }
 */
function wasOpenedByFile () {
  return _wasOpenedByFile
}
exports.wasOpenedByFile = wasOpenedByFile

/*
Load the project file the app was opened with
as workspace if it was opened with one
*/
;(async function () {
  /* FOR WINDOWS */
  if (process.platform === 'win32' && process.argv.length >= 2) {
    _wasOpenedByFile = true

    const filePath = process.argv[1]

    const window = initWindow()
    open(window, filePath)
  }

  /* FOR MACOS */
  app.on('open-file', async (e, filePath) => {
    e.preventDefault()

    _wasOpenedByFile = true
    await isReady()

    const window = initWindow()
    open(window, filePath)
  })
})()

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

  if (url) {
    loadURL(window, url)
  }
  return window
}
exports.initWindow = initWindow

function loadURL (window, url) {
  window.loadURL(url, {
    /*
    The user agent string might be used to identify
    the context within the renderer code
    */
    userAgent: `Bridge/${process.env.npm_package_version}`
  })
}

/**
 * Get the workspace loaded
 * in the provided window
 * @param { BrowserWindow } window
 * @returns { Promise.<Workspace?> }
 */
async function getWorkspace (window) {
  const workspaceId = await window.webContents.executeJavaScript('window.APP.workspace')
  return WorkspaceRegistry.getInstance().get(workspaceId)
}
exports.getWorkspace = getWorkspace

/**
 * Show the open dialog and load the selected
 * workspace in the provided window
 * @param { BrowserWindow } window
 */
async function openWithDialog (window) {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    filters: [{ name: 'Workspace', extensions: [ProjectFile.extensions.workspace] }],
    properties: ['openFile']
  })

  if (canceled || !filePaths[0]) {
    return
  }

  open(window, filePaths[0])
}

/**
 * Open a project file in a window
 * @param { BrowserWindow } window
 * @param { String } filePath
 * @returns { Promise.<Void> }
 */
async function open (window, filePath) {
  app.addRecentDocument(filePath)

  /**
   * @todo
   * Check if workspace is already
   * open based on its file path
   */

  const workspace = await ProjectFile.main.readWorkspace(filePath)
  workspace.state.apply({ _filePath: filePath })

  WorkspaceRegistry.getInstance().add(workspace)

  loadURL(window, `http://localhost:${UserDefaults.data.httpPort}/workspaces/${workspace.id}`)
}

/**
 * Save the state of the provided window
 * to its default location or trigger 'save as'
 * if no location is specified
 * @param { BrowserWindow } window
 */
async function save (window) {
  const workspace = await getWorkspace(window)
  if (!workspace) {
    return
  }

  const filePath = workspace.state.data?._filePath
  if (!filePath) {
    return saveAs(window)
  }

  workspace.state.apply({
    _lastSavedRevision: workspace.state._revision
  })

  ProjectFile.main.writeWorkspace(filePath, workspace)
}

/**
 * Save the state of the provided window
 * while triggering the save-as dialog
 * @param { BrowserWindow } window
 */
async function saveAs (window) {
  const workspace = await getWorkspace(window)
  if (!workspace) {
    return
  }

  const { filePath, canceled } = await dialog.showSaveDialog(window, {
    defaultPath: workspace._filePath
  })

  if (canceled) {
    return
  }

  workspace.state.apply({
    _filePath: `${filePath}.${ProjectFile.extensions.workspace}`
  })
  save(window)
}

/**
* Get the timestamp for when
* the app last resumed,
*
* This is useful in order
* to delay cleanup tasks that
* are time-based
*
* @type { Function }
* @returns { Number }
*/
const lastResumed = (function () {
  let lastResumed = Date.now()

  if (platform.isElectron()) {
    powerMonitor.on('resume', () => { lastResumed = Date.now() })
  }

  return function () {
    return lastResumed
  }
})()
exports.lastResumed = lastResumed

/**
* Get a boolean indicating whether or not
* the system is currently suspended
* @type { Function.<Boolean> }
* @returns { Boolean }
*/
const isSuspended = (function () {
  let isSuspended = false

  if (platform.isElectron()) {
    powerMonitor.on('suspend', () => { isSuspended = true })
    powerMonitor.on('resume', () => { isSuspended = false })
  }

  return function () {
    return isSuspended
  }
})()
exports.isSuspended = isSuspended

/**
 * Get the total number
 * of open windows
 * @returns { Number }
 */
function windowCount () {
  return BrowserWindow.getAllWindows().length
}
exports.windowCount = windowCount

/*
Build and activate
the application menu
if we're currently running
in Electron
*/
;(async function () {
  if (!platform.isElectron()) {
    return
  }

  await app.whenReady()

  const menu = Menu.buildFromTemplate(MENU_TEMPLATE)
  Menu.setApplicationMenu(menu)
})()

/*
Prevent the app from going into sleep
mode when running in Electron
*/
;(function () {
  if (!platform.isElectron()) return
  const id = powerSaveBlocker.start('prevent-app-suspension')

  app.on('before-quit', () => {
    powerSaveBlocker.stop(id)
  })
})()

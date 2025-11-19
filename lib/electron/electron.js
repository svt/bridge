// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const {
  app,
  Menu,
  BrowserWindow,
  shell,
  dialog,
  powerSaveBlocker
} = require('electron')

const paths = require('../paths')
const platform = require('../platform')

const ProjectFile = require('../ProjectFile')
const DIController = require('../../shared/DIController')
const WorkspaceRegistry = require('../WorkspaceRegistry')

const JWT = require('../security/JWT')

const UserDefaults = require('../UserDefaults')
const windowManagement = require('./windowManagement')

const WINDOW_BASE_CONFIG = {
  titleBarStyle: 'hiddenInset',

  frame: process.platform !== 'win32',

  /*
  Only enable transparency on macOS as
  it will disable window resizing on Windows
  */
  transparent: process.platform === 'darwin',
  vibrancy: 'fullscreen-ui',
  backgroundMaterial: 'acrylic',
  webPreferences: {
    contextIsolation: true,
    enableRemoteModule: false,
    nodeIntegration: false,
    webviewTag: false,
    sandbox: true
  }
}

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
        click: () => initNewWorkspaceWindow()
      },
      {
        label: 'Open',
        accelerator: 'CommandOrControl+O',
        click: () => openWithDialog()
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
        click: (_, window) => save(window)
      },
      {
        label: 'Save as',
        accelerator: 'CommandOrControl+Shift+S',
        click: (_, window) => saveAs(window)
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]
  },
  {
    label: 'Plugins',
    submenu: [
      {
        label: 'Manage Plugins...',
        click: () => shell.openPath(paths.plugins)
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
  if (!platform.isElectron()) {
    return
  }

  /**
   * A convenience function for opening
   * a window from a project file,
   * but only if there isn't already
   * another window open with that
   * same file
   * @param { String } filePath
   */
  async function openWithFile (filePath) {
    const alreadyOpenedWindow = await windowManagement.getWindowFromProjectFile(filePath)
    if (alreadyOpenedWindow) {
      alreadyOpenedWindow.focus()
      return
    }
    open(filePath)
  }

  /* FOR WINDOWS */
  if (process.platform === 'win32' && process.argv.length >= 2) {
    const filePath = process.argv[1]

    if (await paths.pathIsFile(filePath)) {
      _wasOpenedByFile = true
      openWithFile(filePath)
    }
  }

  /* FOR MACOS */
  app.on('open-file', async (e, filePath) => {
    e.preventDefault()

    _wasOpenedByFile = true
    await isReady()

    openWithFile(filePath)
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
 * Initialize a new workspace
 * and open a window
 * @param { import('electron').BrowserWindowConstructorOptions | undefined } opts
 */
function initNewWorkspaceWindow (opts = {}) {
  const workspace = DIController.main.instantiate('Workspace')
  workspace.setup()
  WorkspaceRegistry.getInstance().add(workspace)
  return initWorkspaceMainWindow(workspace, opts)
}
exports.initNewWorkspaceWindow = initNewWorkspaceWindow

function hardQuit (window, workspace) {
  WorkspaceRegistry.getInstance().delete(workspace.id)
  workspace.teardown()

  /**
   * Beware that calling window.destroy()
   * won't trigger the close or beforeunload events,
   * and since this function was called within a close
   * event, which is triggered before 'beforeunload',
   * 'beforeunload' will never-ever be called
   *
   * window.close() -> 'close' event -> 'beforeunload' event
   *
   * @see https://www.electronjs.org/docs/latest/api/browser-window#windestroy
   */
  window.destroy()
}

/**
 * Initialize a new
 * window loading a url
 * @param { Workspace } workspace
 * @param { import('electron').BrowserWindowConstructorOptions | undefined } opts
 */
async function initWorkspaceMainWindow (workspace, opts = {}) {
  const _opts = {
    ...WINDOW_BASE_CONFIG,
    width: 1280,
    height: 720,
    minWidth: 560,
    minHeight: 500,
    ...opts
  }

  if (process.env.NODE_ENV === 'development') {
    _opts.webPreferences.webSecurity = false
  }

  const window = new BrowserWindow(_opts)
  const windowId = workspace.props.WindowStore.getNewWindowId()

  workspace.props.WindowStore.addWindow(windowId, window)

  /*
  Close the workspace before closing the window
  rather than on a timer to keep the main
  process running in the background
  */
  window.on('close', async e => {
    /*
    Pause the close until we've
    teared down the workspace
    */
    e.preventDefault()

    if (workspace.state.data._hasUnsavedChanges) {
      const action = await dialog.showMessageBox(window, {
        message: 'Do you want to save changes before closing?',
        type: 'warning',
        buttons: [
          'Save',
          'Don\'t save',
          'Cancel'
        ]
      })

      switch (action.response) {
        /*
        Trigger save and break if
        it's unsuccessful or cancelled
        */
        case 0:
          if (await save(window)) {
            break
          }
          return
        /*
        Hard quit
        without saving
        */
        case 1:
          hardQuit(window, workspace)
          workspace.props.WindowStore.removeWindow(windowId)
          return
        /*
        Cancel close and return
        to the project
        */
        case 2:
          return
      }
    }

    hardQuit(window, workspace)
    workspace.props.WindowStore.removeWindow(windowId)
  })

  window.on('maximize', () => {
    workspace.api.events.emit('window.maximize', windowId)
  })

  window.on('unmaximize', () => {
    workspace.api.events.emit('window.unmaximize', windowId)
  })

  /**
   * Generate an access token that can be
   * used to authorize actions for this session
   */
  const { privateKey } = await workspace.crypto.getKeyPair()
  const token = await JWT.sign({
    sub: windowId,
    aud: workspace.id,
    scope: 'api:window.*'
  }, privateKey, JWT.DEFAULT_ALG)

  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript(`
      window.BRIDGE_TOKEN = '${token}'  
      window.BRIDGE_WINDOW_ID = '${windowId}'
    `)
  })

  loadURL(window, `http://localhost:${UserDefaults.data.httpPort}/workspaces/${workspace.id}`)
  return window
}
exports.initWorkspaceMainWindow = initWorkspaceMainWindow

/**
 * Initialize a new
 * window loading a url
 * @param { String } url A url to load in the window
 * @param { import('electron').BrowserWindowConstructorOptions | undefined } opts
 */
async function initStatelessWindow (url, opts = {}, workspaceOpts = {}) {
  const _opts = {
    ...WINDOW_BASE_CONFIG,
    frame: WINDOW_BASE_CONFIG.frame ? true : !(workspaceOpts.workspace && workspaceOpts.id),
    width: 1280,
    height: 720,
    minWidth: 320,
    minHeight: 180,
    ...opts
  }

  if (process.env.NODE_ENV === 'development') {
    _opts.webPreferences.webSecurity = false
  }

  const window = new BrowserWindow(_opts)

  if (workspaceOpts.workspace && workspaceOpts.id) {
    workspaceOpts.workspace.props.WindowStore.addWindow(workspaceOpts.id, window)

    window.on('maximize', () => {
      workspaceOpts.workspace.api.events.emit('window.maximize', workspaceOpts.id)
    })

    window.on('unmaximize', () => {
      workspaceOpts.workspace.api.events.emit('window.unmaximize', workspaceOpts.id)
    })

    /**
     * Generate an access token that can be
     * used to authorize actions for this session
     */
    const { privateKey } = await workspaceOpts.workspace.crypto.getKeyPair()
    const token = await JWT.sign({
      sub: workspaceOpts.id,
      aud: workspaceOpts.workspace.id,
      scope: 'api:window.*'
    }, privateKey, JWT.DEFAULT_ALG)

    window.webContents.on('did-finish-load', () => {
      window.webContents.executeJavaScript(`
        window.BRIDGE_TOKEN = '${token}'
        window.BRIDGE_WINDOW_ID = '${workspaceOpts.id}'
      `)
    })

    /*
    Remove the window from the
    store when it's closing
    */
    window.on('close', async e => {
      workspaceOpts.workspace.props.WindowStore.removeWindow(windowId)
    })
  }

  if (url) {
    loadURL(window, url)
  }
  return window
}
exports.initStatelessWindow = initStatelessWindow

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
 * Show the open dialog and allow the
 * user to select a new file to open
 */
async function openWithDialog () {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Workspace', extensions: [ProjectFile.extensions.workspace] }],
    properties: ['openFile']
  })

  if (canceled || !filePaths[0]) {
    return
  }

  open(filePaths[0])
}

/**
 * Open a project file in a window
 * @param { String } filePath
 * @returns { Promise.<Void> }
 */
async function open (filePath) {
  app.addRecentDocument(filePath)

  /*
  If there already is a window
  with the selected project opened,
  focus that rather than opening
  a new one
  */
  const alreadyOpenedWindow = await windowManagement.getWindowFromProjectFile(filePath)
  if (alreadyOpenedWindow) {
    alreadyOpenedWindow.focus()
    return
  }

  const workspace = await ProjectFile.main.readWorkspace(filePath)
  workspace.state.apply({ _filePath: filePath })

  WorkspaceRegistry.getInstance().add(workspace)

  initWorkspaceMainWindow(workspace)
}

/**
 * Save the state of the provided window
 * to its default location or trigger 'save as'
 * if no location is specified
 * @param { BrowserWindow } window
 */
async function save (window) {
  const workspace = await windowManagement.getWorkspaceFromWindow(window)
  if (!workspace) {
    return
  }

  const filePath = workspace.state.data?._filePath
  if (!filePath) {
    return saveAs(window)
  }

  app.addRecentDocument(filePath)

  workspace.state.markAsSaved()

  ProjectFile.main.writeWorkspace(filePath, workspace)
  return true
}

/**
 * Save the state of the provided window
 * while triggering the save-as dialog
 * @param { BrowserWindow } window
 */
async function saveAs (window) {
  const workspace = await windowManagement.getWorkspaceFromWindow(window)
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

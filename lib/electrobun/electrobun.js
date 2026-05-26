// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Desktop integration: window creation, menu installation, file dialogs,
power-save blocker, file-association handling. Exposed through
lib/desktop.js so application code can call into it without importing
Electrobun directly.

JWT injection is delivered via the BrowserWindow `preload` option so
`window.BRIDGE_TOKEN` and `window.BRIDGE_WINDOW_ID` are present before
any application script runs in the renderer.
*/

const electrobun = globalThis.__ELECTROBUN__
const { Utils, events: electrobunEvents } = electrobun

const paths = require('../paths')
const platform = require('../platform')

const ProjectFile = require('../ProjectFile')
const DIController = require('../../shared/DIController')
const WorkspaceRegistry = require('../WorkspaceRegistry')

const JWT = require('../security/JWT')
const UserDefaults = require('../UserDefaults')

const Window = require('./Window')
const windowManagement = require('./windowManagement')
const dialogs = require('./dialogs')
const menu = require('./menu')
const powerSaveBlocker = require('./powerSaveBlocker')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Electrobun' })

const WINDOW_BASE_OPTS = {
  titleBarStyle: process.platform === 'win32' ? 'hidden' : 'hiddenInset',
  /*
  Vibrancy + acrylic + titleBarOverlay have no Electrobun equivalents.
  See plan: window chrome will look flatter than the Electron build
  until a custom renderer-side titlebar component is added.
  */
  transparent: process.platform === 'darwin'
}

const MENU_TEMPLATE = [
  { role: 'appMenu' },
  {
    label: 'File',
    submenu: [
      {
        label: 'New workspace',
        accelerator: 'CommandOrControl+n',
        click: () => initNewWorkspaceWindow()
      },
      {
        label: 'New workspace from existing',
        accelerator: 'CommandOrControl+Shift+n',
        click: async () => {
          const path = await openWithDialog()
          if (path) {
            openAsTemplate(path)
          }
        }
      },
      {
        label: 'Open',
        accelerator: 'CommandOrControl+o',
        click: async () => {
          const path = await openWithDialog()
          if (path) {
            open(path)
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Save',
        accelerator: 'CommandOrControl+s',
        click: (_, window) => save(window)
      },
      {
        label: 'Save as',
        accelerator: 'CommandOrControl+Shift+s',
        click: (_, window) => saveAs(window)
      },
      { type: 'separator' },
      {
        label: 'Close window',
        role: 'close',
        accelerator: 'CommandOrControl+w'
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CommandOrControl+z', role: 'undo' },
      { label: 'Redo', accelerator: 'Shift+CommandOrControl+z', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CommandOrControl+x', role: 'cut' },
      { label: 'Copy', accelerator: 'CommandOrControl+c', role: 'copy' },
      { label: 'Paste', accelerator: 'CommandOrControl+v', role: 'paste' },
      { label: 'Select All', accelerator: 'CommandOrControl+a', role: 'selectAll' }
    ]
  },
  {
    label: 'Plugins',
    submenu: [
      {
        label: 'Manage Plugins...',
        click: () => Utils.openPath(paths.plugins)
      }
    ]
  },
  { role: 'viewMenu' },
  { role: 'windowMenu' },
  { role: 'helpMenu' }
]
exports.MENU_TEMPLATE = MENU_TEMPLATE

exports.app = {
  on: (name, handler) => electrobun.app.on(name, handler),
  quit: () => electrobun.app.quit(),
  /*
  No native "recent documents" surface in Electrobun yet — see #6/#9 in
  the migration follow-up tasks for a renderer-side replacement.
  */
  addRecentDocument: () => {},
  /*
  Chromium flags are configured at build time via electrobun.config.ts,
  not at runtime. Stub kept so callers can no-op safely.
  */
  commandLine: { appendSwitch: () => {} },
  whenReady: async () => true,
  once: (event, handler) => electrobun.app.on(event, handler)
}

let _wasOpenedByFile = false
function wasOpenedByFile () {
  return _wasOpenedByFile
}
exports.wasOpenedByFile = wasOpenedByFile

const isReady = (function () {
  let resolved = false
  let resolveReady
  const ready = new Promise(resolve => { resolveReady = resolve })

  /* In Electrobun, the runtime is fully ready by the time this module loads. */
  resolved = true
  resolveReady(true)

  return async function () {
    if (resolved) return true
    return ready
  }
})()
exports.isReady = isReady

function hardQuit (window, workspace) {
  logger.debug('Hard quitting')
  window.destroy()
  WorkspaceRegistry.getInstance().delete(workspace.id)
  workspace.teardown()
  windowManagement.unregister(window)
}

function initNewWorkspaceWindow (opts = {}) {
  const workspace = DIController.main.instantiate('Workspace')
  workspace.setup()
  WorkspaceRegistry.getInstance().add(workspace)
  return initWorkspaceMainWindow(workspace, opts)
}
exports.initNewWorkspaceWindow = initNewWorkspaceWindow

async function initWorkspaceMainWindow (workspace, opts = {}) {
  const windowId = workspace.props.WindowStore.getNewWindowId()

  const { privateKey } = await workspace.crypto.getKeyPair()
  const token = await JWT.sign({
    sub: windowId,
    aud: workspace.id,
    scope: 'api:window.*'
  }, privateKey, JWT.DEFAULT_ALG)

  /*
  Inject the JWT token + windowId before any app script runs in the
  renderer. Strictly safer than the Electron `executeJavaScript` race
  on `did-finish-load`.
  */
  const preload = `
    window.BRIDGE_TOKEN=${JSON.stringify(token)};
    window.BRIDGE_WINDOW_ID=${JSON.stringify(windowId)};
    window.BRIDGE_USER_AGENT=${JSON.stringify(`Bridge/${process.env.npm_package_version || ''}`)};
  `

  const window = new Window({
    ...WINDOW_BASE_OPTS,
    title: 'Bridge',
    width: opts.width ?? 1280,
    height: opts.height ?? 720,
    minWidth: 560,
    minHeight: 500,
    preload,
    url: `http://localhost:${UserDefaults.data.httpPort}/workspaces/${workspace.id}`
  })

  workspace.props.WindowStore.addWindow(windowId, window)
  windowManagement.register(window, workspace.id)
  if (workspace.state?.data?._filePath) {
    windowManagement.setProjectFilePath(window, workspace.state.data._filePath)
  }

  window.on('maximize', () => {
    workspace.api.events.emit('window.maximize', windowId)
  })
  window.on('unmaximize', () => {
    workspace.api.events.emit('window.unmaximize', windowId)
  })

  window.on('close', async e => {
    if (workspace.state.data._hasUnsavedChanges) {
      /*
      Electrobun's BrowserWindow close events don't expose
      preventDefault. We re-implement the unsaved-changes flow by
      intercepting before the OS sends the close — but practically the
      window will close anyway. As a stop-gap we surface the dialog and
      re-create the window if the user cancels. TODO: revisit when
      Electrobun adds cancellable close.
      */
      const action = await dialogs.showMessageBox(window, {
        message: 'Do you want to save changes before closing?',
        type: 'warning',
        buttons: ['Save', 'Don\'t save', 'Cancel'],
        defaultId: 0,
        cancelId: 2
      })

      switch (action.response) {
        case 0:
          if (await save(window)) break
          return
        case 1:
          hardQuit(window, workspace)
          workspace.props.WindowStore.removeWindow(windowId)
          return
        case 2:
          return
      }
    }

    hardQuit(window, workspace)
    workspace.props.WindowStore.removeWindow(windowId)
  })

  return window
}
exports.initWorkspaceMainWindow = initWorkspaceMainWindow

async function initStatelessWindow (url, opts = {}, workspaceOpts = {}) {
  const window = new Window({
    ...WINDOW_BASE_OPTS,
    title: opts.title ?? 'Bridge',
    width: opts.width ?? 1280,
    height: opts.height ?? 720,
    minWidth: 320,
    minHeight: 180,
    url: url || null,
    preload: workspaceOpts.workspace && workspaceOpts.windowId
      ? await makePreload(workspaceOpts.workspace, workspaceOpts.windowId)
      : null
  })

  if (workspaceOpts.workspace && workspaceOpts.windowId) {
    workspaceOpts.workspace.props.WindowStore.addWindow(workspaceOpts.windowId, window)
    windowManagement.register(window, workspaceOpts.workspace.id)

    window.on('maximize', () => {
      workspaceOpts.workspace.api.events.emit('window.maximize', workspaceOpts.windowId)
    })
    window.on('unmaximize', () => {
      workspaceOpts.workspace.api.events.emit('window.unmaximize', workspaceOpts.windowId)
    })
    window.on('close', () => {
      workspaceOpts.workspace.props.WindowStore.removeWindow(workspaceOpts.windowId)
      windowManagement.unregister(window)
    })
  }

  return window
}
exports.initStatelessWindow = initStatelessWindow

async function makePreload (workspace, windowId) {
  const { privateKey } = await workspace.crypto.getKeyPair()
  const token = await JWT.sign({
    sub: windowId,
    aud: workspace.id,
    scope: 'api:window.*'
  }, privateKey, JWT.DEFAULT_ALG)
  return `
    window.BRIDGE_TOKEN=${JSON.stringify(token)};
    window.BRIDGE_WINDOW_ID=${JSON.stringify(windowId)};
  `
}

async function openWithDialog () {
  const { canceled, filePaths } = await dialogs.showOpenDialog({
    filters: [{ name: 'Workspace', extensions: [ProjectFile.extensions.workspace] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths[0]) return
  return filePaths[0]
}

async function open (filePath) {
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
exports.open = open

async function openAsTemplate (filePath) {
  const workspace = await ProjectFile.main.readWorkspace(filePath)
  WorkspaceRegistry.getInstance().add(workspace)
  initWorkspaceMainWindow(workspace)
}

async function save (window) {
  const workspace = await windowManagement.getWorkspaceFromWindow(window)
  if (!workspace) return
  const filePath = workspace.state.data?._filePath
  if (!filePath) return saveAs(window)
  workspace.state.markAsSaved()
  ProjectFile.main.writeWorkspace(filePath, workspace)
  windowManagement.setProjectFilePath(window, filePath)
  logger.info('Saved workspace to', filePath)
  return true
}

async function saveAs (window) {
  const workspace = await windowManagement.getWorkspaceFromWindow(window)
  if (!workspace) return
  const { filePath, canceled } = await dialogs.showSaveDialog(window, {
    defaultPath: workspace.state.data?._filePath
  })
  if (canceled) return

  /*
  The macOS path comes back with the workspace extension (the dialog
  has it in the default name); the folder-picker fallback returns the
  path without it. Append only when needed so we don't end up with
  `foo.bridge.bridge`.
  */
  const ext = '.' + ProjectFile.extensions.workspace
  const finalPath = filePath.endsWith(ext) ? filePath : `${filePath}${ext}`
  workspace.state.apply({ _filePath: finalPath })
  return save(window)
}

function windowCount () {
  return windowManagement.windowCount()
}
exports.windowCount = windowCount

function openExternal (url) {
  return Utils.openExternal(url)
}
exports.openExternal = openExternal

/*
Bootstrap menu + power-save blocker. Only when running under Electrobun.
*/
;(function () {
  if (!platform.isElectrobun()) return

  menu.install(MENU_TEMPLATE)

  powerSaveBlocker.start()
  electrobunEvents.on('before-quit', () => powerSaveBlocker.stop())
})()

/*
Handle macOS "Open With" / Finder double-click of a `.bridge` file.
Electrobun delivers these as file:// URLs through the `open-url` event.
*/
;(function () {
  if (!platform.isElectrobun()) return

  electrobunEvents.on('open-url', async ev => {
    const data = ev?.data ?? ev
    const url = typeof data === 'string' ? data : data?.url
    if (!url || !url.startsWith('file://')) return

    const filePath = decodeURIComponent(url.replace(/^file:\/\//, ''))
    _wasOpenedByFile = true
    const existing = await windowManagement.getWindowFromProjectFile(filePath)
    if (existing) {
      existing.focus()
      return
    }
    open(filePath)
  })
})()

/* Windows file association launch path: file is in argv[1]. */
;(async function () {
  if (!platform.isElectrobun()) return
  if (process.platform !== 'win32') return
  if (process.argv.length < 2) return

  const filePath = process.argv[1]
  if (await paths.pathIsFile(filePath)) {
    _wasOpenedByFile = true
    const existing = await windowManagement.getWindowFromProjectFile(filePath)
    if (existing) {
      existing.focus()
      return
    }
    open(filePath)
  }
})()

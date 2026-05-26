// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Wrapper around an Electrobun BrowserWindow that exposes an
Electron-like surface. SWindow and the WorkspaceRegistry store
instances of this class so existing API call sites (`isMaximized`,
`maximize`, `setAlwaysOnTop`, …) work without runtime-specific branches.

Methods that have no Electrobun equivalent (`setTitleBarOverlay`) are
intentionally omitted so the existing `typeof window?.setTitleBarOverlay`
guard in SWindow.setControlColors falls through to a no-op.
*/

/*
Electrobun is preloaded by lib/electrobun-entry.ts; see paths.js for the
reason we route through globalThis instead of importing here.
*/
const { BrowserWindow } = globalThis.__ELECTROBUN__

class Window {
  /**
   * @param {Partial<import('electrobun/bun').WindowOptionsType>} options
   */
  constructor (options) {
    const frame = {
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? 1280,
      height: options.height ?? 720
    }

    this._minSize = {
      width: options.minWidth ?? 0,
      height: options.minHeight ?? 0
    }

    this._ebWindow = new BrowserWindow({
      title: options.title ?? 'Bridge',
      url: options.url ?? null,
      preload: options.preload ?? null,
      titleBarStyle: options.titleBarStyle ?? 'default',
      transparent: options.transparent ?? false,
      frame
    })

    /*
    Keep listener bookkeeping for the `close`/`maximize`/`unmaximize` events
    we promised in the Electron-like surface.
    */
    this._closeHandlers = []
    this._maximizeHandlers = []
    this._unmaximizeHandlers = []

    this._ebWindow.on('close', e => {
      for (const handler of this._closeHandlers) {
        handler(e)
      }
    })
    this._ebWindow.on('window-maximize', () => {
      for (const handler of this._maximizeHandlers) handler()
    })
    this._ebWindow.on('window-unmaximize', () => {
      for (const handler of this._unmaximizeHandlers) handler()
    })
    /*
    Track focus so menu handlers can fall back to the "last focused
    window" when the application-menu-clicked event payload doesn't
    carry the window id directly.
    */
    const windowManagement = require('./windowManagement')
    this._ebWindow.on('focus', () => windowManagement._markFocused(this))
    windowManagement._markFocused(this)

    /*
    These two properties exist on Electron's BrowserWindow.
    Electrobun does not currently surface them; default to true
    so SWindow's `if (window.minimizable)` / `if (window.closable)`
    guards behave the same as on Electron.
    */
    this.minimizable = true
    this.closable = true
  }

  get id () {
    return this._ebWindow.id
  }

  get nativeWindow () {
    return this._ebWindow
  }

  /* ---- chrome ---- */

  focus () { return this._ebWindow.activate() }
  activate () { return this._ebWindow.activate() }
  show () { return this._ebWindow.show() }
  hide () { return this._ebWindow.hide() }
  close () { return this._ebWindow.close() }
  destroy () {
    this._destroyed = true
    return this._ebWindow.close()
  }

  isDestroyed () { return this._destroyed === true }

  minimize () { return this._ebWindow.minimize() }
  isMinimized () { return this._ebWindow.isMinimized() }

  maximize () { return this._ebWindow.maximize() }
  unmaximize () { return this._ebWindow.unmaximize() }
  isMaximized () { return this._ebWindow.isMaximized() }

  setAlwaysOnTop (flag) { return this._ebWindow.setAlwaysOnTop(flag) }
  isAlwaysOnTop () { return this._ebWindow.isAlwaysOnTop() }

  setFullScreen (flag) { return this._ebWindow.setFullScreen(flag) }
  isFullScreen () { return this._ebWindow.isFullScreen() }

  setSize (width, height) {
    return this._ebWindow.setSize(
      Math.max(width, this._minSize.width),
      Math.max(height, this._minSize.height)
    )
  }

  setPosition (x, y) { return this._ebWindow.setPosition(x, y) }
  getBounds () { return this._ebWindow.getFrame() }

  /* ---- event hooks (Electron-like .on()) ---- */

  on (event, handler) {
    switch (event) {
      case 'close': this._closeHandlers.push(handler); break
      case 'maximize': this._maximizeHandlers.push(handler); break
      case 'unmaximize': this._unmaximizeHandlers.push(handler); break
      default:
        this._ebWindow.on(event, handler)
    }
  }

  /* ---- webContents shim ---- */

  /*
  Provide a minimal `webContents`-like object so any leftover Electron call
  sites (e.g. plugins, third-party code) don't crash. Electrobun delivers
  preload-injection via the constructor `preload` option — we use that in
  initWorkspaceMainWindow rather than executeJavaScript-on-load.
  */
  get webContents () {
    if (!this._webContents) {
      const view = this._ebWindow.webview
      this._webContents = {
        async executeJavaScript (code) {
          if (view && view.rpc && typeof view.rpc.request?.runJs === 'function') {
            return view.rpc.request.runJs({ code })
          }
          return undefined
        },
        on () { /* not used under Electrobun; subscribe to window events instead */ }
      }
    }
    return this._webContents
  }
}

module.exports = Window

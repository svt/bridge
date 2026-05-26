// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Translate the Electron-style MENU_TEMPLATE into an Electrobun
ApplicationMenu config and install it. Items that originally used
`{ click }` handlers are dispatched here via the
'application-menu-clicked' event.

The macOS `appMenu`/`viewMenu`/`windowMenu`/`helpMenu` roles are
expanded manually because Electrobun's role list is granular only.
*/

const { ApplicationMenu, Utils } = globalThis.__ELECTROBUN__

const Logger = require('../Logger')
const logger = new Logger({ name: 'electrobun-menu' })

const APP_NAME = 'Bridge'

/**
 * Build an Electrobun menu config from a Bridge-style MENU_TEMPLATE.
 * Custom click handlers are stored in a map keyed by a synthetic action
 * id so application-menu-clicked can dispatch them.
 *
 * @param { Array<any> } template
 * @returns { { menu: any[], handlers: Map<string, Function> } }
 */
function compile (template) {
  const handlers = new Map()
  let nextId = 0
  const actionId = () => `bridge.menu.${++nextId}`

  function mapItem (item) {
    if (item.type === 'separator' || item.type === 'divider') {
      return { type: 'divider' }
    }

    /* macOS role macros — expand by hand */
    if (item.role === 'appMenu') {
      return {
        label: APP_NAME,
        submenu: [
          { role: 'about', label: `About ${APP_NAME}` },
          { type: 'divider' },
          { role: 'hide', label: `Hide ${APP_NAME}`, accelerator: 'CommandOrControl+h' },
          { role: 'hideOthers' },
          { role: 'showAll' },
          { type: 'divider' },
          { role: 'quit', label: `Quit ${APP_NAME}`, accelerator: 'CommandOrControl+q' }
        ]
      }
    }
    if (item.role === 'viewMenu') {
      return {
        label: 'View',
        submenu: [
          { role: 'toggleFullScreen' }
        ]
      }
    }
    if (item.role === 'windowMenu') {
      return {
        label: 'Window',
        submenu: [
          { role: 'minimize', accelerator: 'CommandOrControl+m' },
          { role: 'zoom' },
          { type: 'divider' },
          { role: 'bringAllToFront' }
        ]
      }
    }
    if (item.role === 'helpMenu') {
      return { label: 'Help', submenu: [] }
    }

    const out = {
      label: item.label,
      type: item.type ?? 'normal',
      accelerator: item.accelerator
    }

    if (item.role) {
      /* Electron-only roles we drop or remap on Electrobun. */
      if (item.role === 'recentdocuments' || item.role === 'clearrecentdocuments') {
        /* TODO: own Open Recent submenu sourced from UserDefaults */
        return null
      }
      out.role = item.role
    } else if (typeof item.click === 'function') {
      const action = actionId()
      out.action = action
      handlers.set(action, item.click)
    }

    if (Array.isArray(item.submenu)) {
      out.submenu = item.submenu.map(mapItem).filter(Boolean)
    }

    return out
  }

  const menu = template.map(mapItem).filter(Boolean)
  return { menu, handlers }
}

/*
Electrobun's `application-menu-clicked` event payload is
`{ id?: number, action: string, data?: unknown }` where `id` is the
native BrowserWindow id of the focused window when the menu was used.
We translate that to the matching Window wrapper before invoking the
handler so Electron-style `(menuItem, window)` callers keep working.
*/
function resolveWindow (windowId) {
  if (typeof windowId !== 'number') return undefined
  const windowManagement = require('./windowManagement')
  for (const entry of windowManagement._entries()) {
    if (entry.window.id === windowId) return entry.window
  }
  return undefined
}

/*
Fallback for when the menu event payload doesn't include the focused
window id: return whatever window we tracked as last-focused via the
Window wrapper's activate hooks, or fall back to the only window we know
about if there's exactly one.
*/
function resolveLastFocusedWindow () {
  const windowManagement = require('./windowManagement')
  const last = windowManagement._lastFocusedWindow()
  if (last) return last
  const all = [...windowManagement._entries()]
  if (all.length === 1) return all[0].window
  return undefined
}

function install (template) {
  const { menu, handlers } = compile(template)

  ApplicationMenu.setApplicationMenu(menu)

  ApplicationMenu.on('application-menu-clicked', event => {
    const data = event?.data ?? event
    const action = typeof data === 'string' ? data : data?.action
    if (!action) return

    const handler = handlers.get(action)
    if (!handler) return

    try {
      const window = resolveWindow(data?.id) || resolveLastFocusedWindow()
      handler(undefined, window)
    } catch (err) {
      logger.error('Menu handler threw', err)
    }
  })

  return { menu, handlers }
}
exports.install = install

/* Re-export so callers can also use Utils.openPath without importing electrobun directly. */
exports.openPath = Utils.openPath
exports.openExternal = Utils.openExternal

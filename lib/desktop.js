// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Platform-aware facade over the desktop integration layer.
Callers that need to spawn windows, build menus, or open external URLs
should require this module rather than reaching into ./electrobun/
directly. Kept as a separate module so application code does not have
to know which runtime is hosting it.
*/

const platform = require('./platform')

let impl

if (platform.isElectrobun()) {
  impl = require('./electrobun/electrobun')
} else {
  /*
  Headless / Node-only context. SWindow is registered with DIController
  and may be required from the renderer; the methods should never run
  outside a desktop runtime — surface a clear error if they're called.
  */
  const notDesktop = () => {
    throw new Error('Desktop integration is not available outside Electrobun')
  }
  impl = {
    app: { on: () => {}, quit: () => {}, addRecentDocument: () => {}, commandLine: { appendSwitch: () => {} } },
    MENU_TEMPLATE: [],
    isReady: async () => true,
    wasOpenedByFile: () => false,
    initNewWorkspaceWindow: notDesktop,
    initWorkspaceMainWindow: notDesktop,
    initStatelessWindow: notDesktop,
    windowCount: () => 0,
    openExternal: () => {}
  }
}

module.exports = impl

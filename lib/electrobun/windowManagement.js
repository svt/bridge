// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Sync registry that maps workspaces, project files, and Electrobun
window ids to Window instances. Replaces the Electron version, which
had to do an executeJavaScript round-trip + 100 ms timeout race to
discover which window hosted which workspace. Here we set the tag at
window-creation time and read it synchronously.
*/

const WorkspaceRegistry = require('../WorkspaceRegistry')

/** @type { Map<number, { window: import('./Window'), workspaceId: string, filePath: string | null }> } */
const byWindowId = new Map()

/** @type { Map<string, import('./Window')> } */
const byWorkspaceId = new Map()

function register (window, workspaceId) {
  byWindowId.set(window.id, { window, workspaceId, filePath: null })
  byWorkspaceId.set(workspaceId, window)
}
exports.register = register

function unregister (window) {
  const entry = byWindowId.get(window.id)
  if (!entry) return
  byWindowId.delete(window.id)
  byWorkspaceId.delete(entry.workspaceId)
}
exports.unregister = unregister

function setProjectFilePath (window, filePath) {
  const entry = byWindowId.get(window.id)
  if (entry) entry.filePath = filePath
}
exports.setProjectFilePath = setProjectFilePath

/**
 * @param { string } workspaceId
 * @returns { Promise<import('./Window') | undefined> }
 */
async function getWindowFromWorkspace (workspaceId) {
  return byWorkspaceId.get(workspaceId)
}
exports.getWindowFromWorkspace = getWindowFromWorkspace

/**
 * @param { import('./Window') } window
 * @returns { Promise<unknown | undefined> }
 */
async function getWorkspaceFromWindow (window) {
  const entry = byWindowId.get(window.id)
  if (!entry) return
  return WorkspaceRegistry.getInstance().get(entry.workspaceId)
}
exports.getWorkspaceFromWindow = getWorkspaceFromWindow

/**
 * @param { string } filePath
 * @returns { Promise<import('./Window') | undefined> }
 */
async function getWindowFromProjectFile (filePath) {
  for (const entry of byWindowId.values()) {
    if (entry.filePath === filePath) return entry.window
  }
}
exports.getWindowFromProjectFile = getWindowFromProjectFile

function windowCount () {
  return byWindowId.size
}
exports.windowCount = windowCount

/**
 * Iterate over all registered window entries.
 * Used by lib/electrobun/menu.js to resolve which Window wrapper
 * corresponds to a native Electrobun BrowserWindow id surfaced in
 * the application-menu-clicked event payload.
 */
exports._entries = function () {
  return byWindowId.values()
}

let _lastFocused = null
exports._markFocused = function (window) {
  _lastFocused = window
}
exports._lastFocusedWindow = function () {
  return _lastFocused
}

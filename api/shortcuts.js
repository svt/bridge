// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *   id: String,
 *   description: String,
 *   trigger: String[]
 * }} ShortcutSpec
 */

const state = require('./state')
const commands = require('./commands')

/**
 * Make a widget available
 * to the application
 * @param { ShortcutSpec } spec
 */
function registerShortcut (spec = {}) {
  return commands.executeCommand('shortcuts.registerShortcut', spec)
}
exports.registerWidget = registerShortcut

/**
 * Get a shortcut's
 * specification
 * @param { String } id
 * @returns { Promise.<ShortcutSpec> }
 */
function getShortcut (id) {
  return state.getLocalState()?._shortcuts?.[id]
}
exports.getShortcut = getShortcut

/**
 * Get all shortcuts'
 * specifications
 * @returns { Promise.<ShortcutSpec[]> }
 */
async function getShortcuts () {
  const index = state.getLocalState()?._shortcuts
  return Object.values(index || {})
}
exports.getShortcuts = getShortcuts

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *   id: String,
 *   action: String,
 *   description: String,
 *   trigger: String[]
 * }} ShortcutSpec
 *
 * @typedef {{
 *   trigger: String[]
 * }} ShortcutOverrideSpec
 */

const state = require('./state')
const commands = require('./commands')

const InvalidArgumentError = require('./error/InvalidArgumentError')

/**
 * Make a shortcut available
 * to the application
 * @param { ShortcutSpec } spec
 */
function registerShortcut (spec = {}) {
  return commands.executeCommand('shortcuts.registerShortcut', spec)
}
exports.registerShortcut = registerShortcut

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
  const overrides = state.getLocalState()?._userDefaults?.shortcuts

  return Object.values(index || {})
    .map(shortcut => {
      return {
        ...shortcut,
        ...(overrides[shortcut.id] || {})
      }
    })
}
exports.getShortcuts = getShortcuts

/**
 * Register a new shortcut override
 *
 * Note that the override will be registered
 * to the user defaults state for the current
 * main process and not necessarily the local
 * user
 *
 * @param { String } id An identifier of the shortcut to override
 * @param { ShortcutOverrideSpec } spec A specification to use as an override
 * @returns { Promise.<void> }
 */
async function registerShortcutOverride (id, spec) {
  if (typeof spec !== 'object') {
    throw new InvalidArgumentError('The provided \'spec\' must be a shortcut override specification')
  }

  if (typeof id !== 'string') {
    throw new InvalidArgumentError('The provided \'id\' must be a string')
  }

  const currentOverride = await state.get(`_userDefaults.shortcuts.${id}`)
  const set = { [id]: spec }

  if (currentOverride) {
    set[id] = { $replace: spec }
  }

  state.apply({
    _userDefaults: {
      shortcuts: set
    }
  })
}
exports.registerShortcutOverride = registerShortcutOverride

/**
 * Clear any override for a
 * specific shortcut by its id
 * @param { String } id
 */
async function clearShortcutOverride (id) {
  state.apply({
    _userDefaults: {
      shortcuts: {
        [id]: { $delete: true }
      }
    }
  })
}
exports.clearShortcutOverride = clearShortcutOverride

/**
 * Get a shortcut override specification
 * for a shortcut by its id
 * @param { String } id
 * @returns { Promise.<ShortcutOverrideSpec | undefined> }
 */
async function getShortcutOverride (id) {
  return state.get(`_userDefaults.shortcuts.${id}`)
}
exports.getShortcutOverride = getShortcutOverride

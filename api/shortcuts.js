// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const state = require('./state')
const commands = require('./commands')

/**
 * Make a widget available
 * to the application
 *
 * @typedef {{
 *   id: String,
 *   description: String,
 *   trigger: String[]
 * }} ShortcutSpec
 *
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
  return state.get(`_shortcuts.${id}`)
}

/**
 * Capture a shortcut from a keyboard event
 * and only execute the provided callback
 * @param { KeyboardEvent } e
 * @param { String } id The id of the shortcut to capture
 * @param { Function } callback A callback to execute when the shortcut is captured
 *
 * @todo: Match multiple keys
 */
async function captureShortcut (e, id, callback) {
  const shortcut = await getShortcut(id)
  console.log(shortcut)
}
exports.captureShortcut = captureShortcut

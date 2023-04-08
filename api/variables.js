// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const commands = require('./commands')

/**
 * Set a variable's value
 * @param { String } key
 * @param { any } value
 */
function setVariable (key, value) {
  return commands.executeCommand('variables.setVariable', key, value)
}
exports.setVariable = setVariable

/**
 * Get a variable's value
 * @param { String } key
 * @returns { Promise.<any> }
 */
function getVariable (key) {
  return commands.executeCommand('variables.getVariable', key)
}
exports.getVariable = getVariable

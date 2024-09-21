// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const objectPath = require('object-path')

const commands = require('./commands')
const state = require('./state')

const VARIABLE_REGEX = /\$\((.*?)\)/g

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

/**
 * Get all variables' values
 * @returns { Promise.<any> }
 */
async function getAllVariables () {
  return state.get('variables')
}
exports.getAllVariables = getAllVariables

/**
 * Substitute variables for their
 * values in a string
 *
 * @example
 * "Hello $(my variable)" -> "Hello world"
 *
 * @param { String } str
 * @param { any } data          Data to substitute variables for,
 *                              defaults to the local state
 * @param { any } overrideData  Data that will override the
 *                              default data rather than replace
 * @returns { String }
 */
function substituteInString (str, data = (state.getLocalState()?.variables || {}), overrideData = {}) {
  const text = str.split(VARIABLE_REGEX)
  const values = {
    ...data,
    ...overrideData
  }

  let out = ''
  let i = 0

  while (text.length > 0) {
    if (i % 2 === 0) {
      out += text.shift()
    } else {
      const path = text.shift()
      const value = objectPath.get(values, path)
      out += value || ''
    }
    i++
  }
  return out
}
exports.substituteInString = substituteInString

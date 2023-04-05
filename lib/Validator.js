// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Ajv = require('ajv')
const ValidationError = require('./error/ValidationError')

const settingSchema = require('./schemas/setting.schema.json')
const shortcutSchema = require('./schemas/shortcuts.schema.json')
const pluginSchema = require('./schemas/plugin.schema.json')
const typeSchema = require('./schemas/type.schema.json')

const ajv = new Ajv({
  schemas: [
    shortcutSchema,
    settingSchema,
    pluginSchema,
    typeSchema
  ]
})

/**
 * Get a validator function
 * for plugin manifests
 * @type { Ajv.ValidateFunction }
 */
function getPluginValidator () {
  return ajv.getSchema(pluginSchema.$id)
}
exports.getPluginValidator = getPluginValidator

/**
 * Get a validator function
 * for type declarations
 * @type { Ajv.ValidateFunction }
 */
function getTypeValidator () {
  return ajv.getSchema(typeSchema.$id)
}
exports.getTypeValidator = getTypeValidator

/**
 * Get a validator function
 * for setting declarations
 * @type { Ajv.ValidateFunction }
 */
function getSettingValidator () {
  return ajv.getSchema(settingSchema.$id)
}
exports.getSettingValidator = getSettingValidator

/**
 * Get a validator function
 * for shortcut declarations
 * @type { Ajv.ValidateFunction }
 */
function getShortcutValidator () {
  return ajv.getSchema(shortcutSchema.$id)
}
exports.getShortcutValidator = getShortcutValidator

/**
 * Get the first validation error
 * from a validator function
 * @param { Ajv.ValidateFunction } validator
 * @returns { ValidationError? }
 */
function getFirstError (validator) {
  const errors = validator.errors
  if (!errors[0]) return undefined

  return new ValidationError(
    errors[0].message,
    'ERR_VALIDATION_FAILED',
    errors[0].params
  )
}
exports.getFirstError = getFirstError

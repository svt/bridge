// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  $id: String,
 *  name: String
 * }} SettingSpecification See lib/schemas/setting.schema.json for complete spec
 *
 * @typedef {{
 *  registerSetting: registerSetting
 * }} SettingsApi
 */

const Validator = require('../Validator')

/**
 * A factory function
 * for the settings API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * @type { SettingsApi }
   */
  api.settings = {}

  /**
   * Register a setting by
   * its specification
   * @param { String } groupName The group name that the setting should be assigned to
   * @param { SettingSpecification } specification A setting specification
   * @returns { Promise.<Boolean> }
   */
  function registerSetting (groupName, specification) {
    const validate = Validator.getSettingValidator()
    const isValid = validate(specification)

    if (!isValid) {
      throw Validator.getFirstError(validate)
    }

    workspace.state.apply({
      _settings: {
        [groupName]: [specification]
      }
    })
    return true
  }
  api.settings.registerSetting = registerSetting
  api.commands.registerAsyncCommand('settings.registerSetting', registerSetting)
}
exports.factory = factory

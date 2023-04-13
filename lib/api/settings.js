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

    /*
    Make sure that the settings-group actually exists as an
    array in the state before pushing the specifications
    */
    if (!workspace.state.data._settings?.[groupName]) {
      workspace.state.apply({
        _settings: {
          [groupName]: []
        }
      })
    }

    workspace.state.apply({
      _settings: {
        [groupName]: { $push: [specification] }
      }
    })
    return true
  }
  api.settings.registerSetting = registerSetting
  api.commands.registerAsyncCommand('settings.registerSetting', registerSetting)
}
exports.factory = factory

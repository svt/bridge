// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  $id: String,
 *  name: String
 * }} SettingSpecification See lib/schemas/setting.schema.json for complete spec
 */

const commands = require('./commands')

/**
 * Register a setting
 * by its specification
 * @param { String } groupName The group name that the setting should be assigned to
 * @param { SettingSpecification } specification A setting specification
 * @returns { Promise.<Boolean> }
 */
function registerSetting (groupName, specification) {
  return commands.executeCommand('settings.registerSetting', groupName, specification)
}
exports.registerSetting = registerSetting

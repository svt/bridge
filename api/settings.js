// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  $id: String,
 *  group: String,
 *  name: String
 * }} SettingSpecification See lib/schemas/setting.schema.json for complete spec
 */

const commands = require('./commands')

/**
 * Register a setting
 * by its specification
 * @param { SettingSpecification } specification A setting specification
 * @returns { Promise.<Boolean> }
 */
function registerSetting (specification) {
  return commands.executeCommand('settings.registerSetting', specification)
}
exports.registerSetting = registerSetting

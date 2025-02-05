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

const DIController = require('../shared/DIController')

class Settings {
  #props

  constructor (props) {
    this.#props = props
  }

  /**
   * Register a setting
   * by its specification
   * @param { SettingSpecification } specification A setting specification
   * @returns { Promise.<Boolean> }
   */
  registerSetting (specification) {
    return this.#props.Commands.executeCommand('settings.registerSetting', specification)
  }
}

DIController.main.register('Settings', Settings, [
  'Commands'
])

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

const MissingArgumentError = require('./error/MissingArgumentError')
const InvalidArgumentError = require('./error/InvalidArgumentError')

class Settings {
  #props

  constructor (props) {
    this.#props = props
  }

  /**
   * Register a setting
   * by its specification
   * @param { SettingSpecification } specification A setting specification
   * @returns { Promise.<string> }
   */
  registerSetting (specification) {
    return this.#props.Commands.executeCommand('settings.registerSetting', specification)
  }

  /**
   * Apply changes to a registered
   * setting in the state
   *
   * @param { String } id The id of a setting to update
   * @param { SettingSpecification } set A setting object to apply
   * @returns { Promise.<boolean> }
   */
  async applySetting (id, set = {}) {
    if (typeof id !== 'string') {
      throw new MissingArgumentError('Invalid value for item id, must be a string')
    }

    if (typeof set !== 'object' || Array.isArray(set)) {
      throw new InvalidArgumentError('Argument \'set\' must be a valid object that\'s not an array')
    }

    return this.#props.Commands.executeCommand('settings.applySetting', id, set)
  }
}

DIController.main.register('Settings', Settings, [
  'Commands'
])

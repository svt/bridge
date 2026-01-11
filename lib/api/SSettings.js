// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  $id: String,
 *  name: String
 * }} SettingSpecification See lib/schemas/setting.schema.json for complete spec
 */

const Validator = require('../Validator')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SSettings extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('settings.registerSetting', this.registerSetting.bind(this))
  }

  /**
   * Register a setting by
   * its specification
   * @param { SettingSpecification } specification A setting specification
   * @returns { Promise.<Boolean> }
   */
  registerSetting (specification) {
    const validate = Validator.getSettingValidator()
    const isValid = validate(specification)

    if (!isValid) {
      throw Validator.getFirstError(validate)
    }

    /*
    Make sure that the settings-group actually exists as an
    array in the state before pushing the specifications
    */
    if (!this.props.Workspace.state.data._settings?.[specification.group]) {
      this.props.SState.applyState({
        _settings: {
          [specification.group]: [specification]
        }
      })
    } else {
      this.props.SState.applyState({
        _settings: {
          [specification.group]: { $push: [specification] }
        }
      })
    }

    return true
  }
}

DIController.main.register('SSettings', SSettings, [
  'Workspace',
  'SCommands',
  'SState'
])

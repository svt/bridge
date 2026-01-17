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
const uuid = require('uuid')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SSettings extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('settings.registerSetting', this.registerSetting.bind(this))
    this.props.SCommands.registerAsyncCommand('settings.applySetting', this.applySetting.bind(this))
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
    Add an id to the spec
    for later reference
    */
    const _specification = {
      ...specification,
      id: uuid.v4()
    }

    /*
    Make sure that the settings-group actually exists as an
    array in the state before pushing the specifications
    */
    if (!this.props.Workspace.state.data._settings?.[_specification.group]) {
      this.props.SState.applyState({
        _settings: {
          [_specification.group]: [_specification]
        }
      })
    } else {
      this.props.SState.applyState({
        _settings: {
          [_specification.group]: { $push: [_specification] }
        }
      })
    }

    return _specification.id
  }

  /**
   * Apply a registered
   * setting in the state
   *
   * @param { String } id The id of a setting to update
   * @param { SettingSpecification } set A setting object to apply
   * @returns { Promise.<boolean> }
   */
  applySetting (id, set) {
    const groups = Object.entries(this.props.Workspace.state?.data?._settings || {})
    let groupName
    let indexInGroup

    for (const [group, settings] of groups) {
      if (!Array.isArray(settings)) {
        continue
      }

      const settingIndex = settings.findIndex(setting => setting.id === id)
      if (settingIndex === -1) {
        continue
      }

      groupName = group
      indexInGroup = settingIndex
    }

    if (!groupName || indexInGroup == null) {
      return
    }

    const _set = []
    _set[indexInGroup] = set

    this.props.SState.applyState({
      _settings: {
        [groupName]: _set
      }
    })

    return true
  }
}

DIController.main.register('SSettings', SSettings, [
  'Workspace',
  'SCommands',
  'SState'
])

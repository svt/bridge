// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Validator = require('../Validator')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SShortcuts extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('shortcuts.registerShortcut', this.registerShortcut.bind(this))
  }

  /**
   * Register a type by
   * its specification
   * @param { ShortcutSpecification } specification A shortcut specification
   * @returns { Promise.<Boolean> }
   */
  registerShortcut (specification) {
    const validate = Validator.getShortcutValidator()
    const isValid = validate(specification)

    if (!isValid) {
      throw Validator.getFirstError(validate)
    }

    this.props.SState.applyState({
      _shortcuts: {
        [specification.id]: {
          ...specification
        }
      }
    })
    return true
  }
}

DIController.main.register('SShortcuts', SShortcuts, [
  'SCommands',
  'SState'
])

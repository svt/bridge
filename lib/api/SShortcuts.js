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
    this.props.SCommands.registerCommand('shortcuts.removeShortcut', this.removeShortcut.bind(this))
  }

  /**
   * Remove a shortcut
   * by its id – will do nothing
   * if an invalid id is received
   * @param { string } id
   * @returns
   */
  removeShortcut (id) {
    const shortcut = this.props.SState.getState(`_shortcuts.${id}`)
    if (!shortcut) {
      return
    }
    this.props.SState.applyState({
      _shortcuts: {
        [id]: { $delete: true }
      }
    })
  }

  /**
   * Register a type by
   * its specification
   * @param { ShortcutSpecification } specification A shortcut specification
   * @returns { Promise.<boolean> }
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

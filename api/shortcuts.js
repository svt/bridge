// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *   id: String,
 *   action: String,
 *   description: String,
 *   trigger: String[]
 * }} ShortcutSpec
 *
 * @typedef {{
 *   trigger: String[]
 * }} ShortcutOverrideSpec
 */

const InvalidArgumentError = require('./error/InvalidArgumentError')
const DIController = require('../shared/DIController')

class Shortcuts {
  #props

  constructor (props) {
    this.#props = props
  }

  /**
   * Make a shortcut available
   * to the application
   * @param { ShortcutSpec } spec
   */
  registerShortcut (spec = {}) {
    return this.#props.Commands.executeCommand('shortcuts.registerShortcut', spec)
  }

  /**
   * Get a shortcut's
   * specification
   * @param { String } id
   * @returns { Promise.<ShortcutSpec> }
   */
  getShortcut (id) {
    return this.#props.State.getLocalState()?._shortcuts?.[id]
  }

  /**
   * Remove a registered shortcut
   * @param { string } id
   */
  removeShortcut (id) {
    this.#props.Commands.executeCommand('shortcuts.removeShortcut', id)
  }

  /**
   * Get all shortcuts'
   * specifications
   * @returns { Promise.<ShortcutSpec[]> }
   */
  async getShortcuts () {
    const index = this.#props.State.getLocalState()?._shortcuts
    const overrides = this.#props.State.getLocalState()?._userDefaults?.shortcuts || {}

    return Object.values(index || {})
      .map(shortcut => {
        return {
          ...shortcut,
          ...(overrides[shortcut.id] || {})
        }
      })
  }

  /**
   * Register a new shortcut override
   *
   * Note that the override will be registered
   * to the user defaults this.#props.State for the current
   * main process and not necessarily the local
   * user
   *
   * @param { String } id An identifier of the shortcut to override
   * @param { ShortcutOverrideSpec } spec A specification to use as an override
   * @returns { Promise.<void> }
   */
  async registerShortcutOverride (id, spec) {
    if (typeof spec !== 'object') {
      throw new InvalidArgumentError('The provided \'spec\' must be a shortcut override specification')
    }

    if (typeof id !== 'string') {
      throw new InvalidArgumentError('The provided \'id\' must be a string')
    }

    const currentOverride = await this.#props.State.get(`_userDefaults.shortcuts.${id}`)
    const set = { [id]: spec }

    if (currentOverride) {
      set[id] = { $replace: spec }
    }

    this.#props.State.apply({
      _userDefaults: {
        shortcuts: set
      }
    })
  }

  /**
   * Clear any override for a
   * specific shortcut by its id
   * @param { String } id
   */
  async clearShortcutOverride (id) {
    this.#props.State.apply({
      _userDefaults: {
        shortcuts: {
          [id]: { $delete: true }
        }
      }
    })
  }

  /**
   * Get a shortcut override specification
   * for a shortcut by its id
   * @param { String } id
   * @returns { Promise.<ShortcutOverrideSpec | undefined> }
   */
  async getShortcutOverride (id) {
    return this.#props.State.get(`_userDefaults.shortcuts.${id}`)
  }
}

DIController.main.register('Shortcuts', Shortcuts, [
  'State',
  'Commands'
])

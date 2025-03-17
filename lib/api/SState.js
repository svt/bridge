// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const objectPath = require('object-path')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SState extends DIBase {
  /**
   * @type { Map.<String, Map.<String, Handler> }
   */
  #events = new Map()

  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerCommand('state.apply', this.applyState.bind(this))
    this.props.SCommands.registerAsyncCommand('state.get', this.getState.bind(this))
  }

  /**
   * Apply some arbitrary
   * data to the state
   *
   * This function only exists
   * to run the apply function
   * the correct scope
   * @param { Object } set Some data to set
   */
  applyState (set, transparent) {
    this.props.Workspace.state.apply(set, transparent)
  }

  /**
   * Get the current
   * full state or part
   * of the state using a
   * dot-notation path
   * @param { String } path An optional path for only
   *                        getting part of the state
   * @returns { any }
   *//**
   * Get the full state
   * @returns { any }
   */
  getState (path) {
    const data = this.props.Workspace.state.data
    if (path) {
      return objectPath.get(data, path)
    }
    return data
  }
}

DIController.main.register('SState', SState, [
  'Workspace',
  'SCommands'
])

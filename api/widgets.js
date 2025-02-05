// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../shared/DIController')

class Widgets {
  #props

  constructor (props) {
    this.#props = props
  }

  /**
   * Make a widget available
   * to the application
   * @param {
   *   id: String,
   *   name: String,
   *   uri: String,
   *   description: String
   * } spec
   */
  registerWidget (spec) {
    this.#props.State.apply({
      _widgets: {
        [spec.id]: spec
      }
    })
  }
}

DIController.main.register('Widgets', Widgets, [
  'State'
])

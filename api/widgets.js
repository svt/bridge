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
   * @param { import('../shared/definitions.js').BridgeApiWidgetSpec } spec
   */
  registerWidget (spec) {
    this.#props.Commands.executeCommand('widgets.registerWidget', spec)
  }
}

DIController.main.register('Widgets', Widgets, [
  'Commands'
])

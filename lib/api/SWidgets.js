// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @file Implements the widget API
 * @description This API is INTERNAL and may change anytime,
 *              it is not meant to be used by plugin developers
 */

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Widget api' })

class SWidgets extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('widgets.registerWidget', this.registerWidget.bind(this))
    this.#registerInternalWidgets()
  }

  /**
   * Register any internal widgets that
   * should be usable from the UI
   */
  #registerInternalWidgets () {
    this.registerWidget({
      id: 'bridge.internals.browser',
      name: 'Embed',
      description: 'Embed a web page'
    })
  }

  /**
   * Register a widget to the state
   * @param { import('../../shared/definitions.js').BridgeApiWidgetSpec } spec
   */
  registerWidget (spec = {}) {
    logger.debug('Registering widget', spec?.id)
    this.props.SState.applyState({
      _widgets: {
        [spec.id]: spec
      }
    })
  }
}

DIController.main.register('SWidgets', SWidgets, [
  'SCommands',
  'SState'
])

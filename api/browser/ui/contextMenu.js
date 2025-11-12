// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../../shared/DIController')

class UIContextMenu {
  #props

  constructor (props) {
    this.#props = props
  }

  open (opts, spec) {
    this.#props.Events.emitLocally('ui.contextMenu', opts, spec)
  }
}

DIController.main.register('UIContextMenu', UIContextMenu, [
  'Events'
])

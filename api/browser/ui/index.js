// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../../shared/DIController')

require('./contextMenu')

class UI {
  constructor (props) {
    this.contextMenu = props.UIContextMenu
  }
}

DIController.main.register('UI', UI, [
  'UIContextMenu'
])

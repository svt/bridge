// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../../shared/DIController')

require('./contextMenu')
require('./modal')

class UI {
  constructor (props) {
    this.contextMenu = props.UIContextMenu
    this.modal = props.UIModal
  }
}

DIController.main.register('UI', UI, [
  'UIContextMenu',
  'UIModal'
])

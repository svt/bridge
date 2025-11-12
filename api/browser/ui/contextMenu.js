// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../../shared/DIController')

/**
 * A threshold for how long the context menu has
 * to have been open before an event can close it
 *
 * This it to prevent the same event to
 * both open and close a context menu
 *
 * @type { Number }
 */
const OPEN_THRESHOLD_MS = 100

class UIContextMenu {
  #props
  #openedAt

  constructor (props) {
    this.#props = props
  }

  close () {
    /*
    Check how long the context menu has been opened
    to prevent it from closing on the same event that
    opened it
    */
    if (Date.now() - this.#openedAt <= OPEN_THRESHOLD_MS) {
      return
    }
    this.#props.Events.emitLocally('ui.contextMenu.close')
  }

  open (opts, spec) {
    this.#openedAt = Date.now()
    this.#props.Events.emitLocally('ui.contextMenu.open', opts, spec)
  }
}

DIController.main.register('UIContextMenu', UIContextMenu, [
  'Events'
])

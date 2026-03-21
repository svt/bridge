// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../../shared/DIController')

const MissingArgumentError = require('../../error/MissingArgumentError')
const InvalidArgumentError = require('../../error/InvalidArgumentError')

/**
 * A threshold for how long the context menu has
 * to have been open before an event can close it
 *
 * This it to prevent the same event to
 * both open and close a context menu
 *
 * @type { number }
 */
const OPEN_THRESHOLD_MS = 100

/**
 * @class UIContextMenu
 *
 * @typedef {{
 *  type: 'item' | 'divider',
 *  label: string?
 *  children: ContextMenuSpecItem[]?,
 *  onClick: Function.<void>?
 * }} ContextMenuSpecItem
 *
 * @typedef {(ContextMenuSpecItem[])} ContextMenuSpec
 *
 * @typedef {{
 *  x: number,
 *  y: number,
 *  searchable: boolean?
 * }} ContextMenuOpts
 */
class UIContextMenu {
  #props
  #openedAt

  constructor (props) {
    this.#props = props
  }

  /**
   * Close any context menus
   * that are currently open
   */
  close () {
    /*
    Check that there is actually a
    context menu that's currently open
    */
    if (!this.#openedAt) {
      return
    }

    /*
    Check how long the context menu has been opened
    to prevent it from closing on the same event that
    opened it
    */
    if (Date.now() - this.#openedAt <= OPEN_THRESHOLD_MS) {
      return
    }

    this.#openedAt = undefined
    this.#props.Events.emitLocally('ui.contextMenu.close')
  }

  /**
   * Open a context menu
   * @param { ContextMenuSpec } spec
   * @param { ContextMenuOpts } opts
   */
  open (spec, opts) {
    if (!spec) {
      throw new MissingArgumentError('Missing required argument \'spec\'')
    }

    if (!Array.isArray(spec)) {
      throw new InvalidArgumentError('Context menu spec must be an array')
    }

    if (!opts) {
      throw new MissingArgumentError('Missing required argument \'opts\'')
    }

    if (typeof opts?.x !== 'number' || typeof opts?.y !== 'number') {
      throw new InvalidArgumentError('Cannot open context menu without x and y position')
    }

    /*
    Close any currently opened menu
    before opening a new one
    */
    if (this.#openedAt) {
      this.close()
    }

    this.#openedAt = Date.now()
    this.#props.Events.emitLocally('ui.contextMenu.open', spec, opts)
  }

  /**
   * Get the event position for use
   * when opening a context menu
   * @param { PointerEvent } e
   * @returns
   */
  getPositionFromEvent (e) {
    if (Object.prototype.hasOwnProperty.call(e.nativeEvent, 'pointerType')) {
      throw new InvalidArgumentError('Provided event is not of type PointerEvent')
    }

    /*
    Find the root element, either an encapsulating
    iframe or the body and use its position
    as offset for the event
    */
    let rootEl = e?.target?.ownerDocument?.defaultView?.frameElement
    if (!rootEl) {
      rootEl = document.body
    }

    const bounds = rootEl.getBoundingClientRect()

    return {
      x: e.clientX + bounds.x,
      y: e.clientY + bounds.y
    }
  }
}

DIController.main.register('UIContextMenu', UIContextMenu, [
  'Events'
])

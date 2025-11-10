// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')

/**
 * The default state object,
 * if nothing else is specified,
 * for the 'selection' event
 *
 * @type { ClientSelectionState }
 */
const DEFAULT_SELECTION_EVENT_STATE = {
  caller: undefined
}

/**
 * @private
 * Ensure that a 'thing' is an array,
 * if it's not, one will be created and
 * the 'thing' will be inserted
 * @param { any } thing Anything to make into an array
 *                      if it isn't one already
 * @returns { any[] }
 */
function ensureArray (thing) {
  let arr = thing
  if (!Array.isArray(thing)) {
    arr = [thing]
  }
  return arr
}

class Selection {
  #props
  #client
  #selection = []

  // eslint-disable-next-line accessor-pairs
  set client (newValue) {
    if (this.#client) {
      return
    }
    this.#client = newValue
  }

  constructor (props) {
    this.#props = props
  }

  /**
   * Select an item,
   * will replace the
   * current selection
   * @param { String } item A string to select
   *//**
   * Select multiple items,
   * will replace the
   * current selection
   * @param { String[] } item Multiple items to select
   * @param { ClientSelectionState } state An optional state to pass with the event
   */
  async setSelection (item, state = DEFAULT_SELECTION_EVENT_STATE) {
    this.#client?.assertIdentity()

    const items = ensureArray(item)

    this.#selection = items

    await this.#props.State.apply({
      _connections: {
        [this.#client.getIdentity()]: {
          selection: { $replace: items }
        }
      }
    })

    this.#props.Events.emitLocally('selection', items, state)
  }

  /**
   * Select an item by adding to the
   * client's already existing selection
   * @param { String } item The id of an item to add
   *//**
   * Select multiple items by adding to
   * the client's already existing selection
   * @param { String[] } item An array of ids for
   *                           the items to add
   */
  async addSelection (item) {
    const currentSelection = await this.getSelection()
    const newSelectionSet = new Set(Array.isArray(currentSelection) ? currentSelection : [])
    const newItems = ensureArray(item)

    for (const item of newItems) {
      newSelectionSet.add(item)
    }

    const newSelection = Array.from(newSelectionSet.values())
    this.setSelection(newSelection)
  }

  /**
   * Subtract an item from
   * the current selection
   * @param { String } item The id of an item to subtract
   *//**
   * Subtract multiple items
   * from the current selection
   * @param { String[] } item An array of ids of items to subtract
   */
  subtractSelection (item) {
    const selection = this.#selection
    if (!selection) {
      return
    }

    const items = new Set(ensureArray(item))
    const newSelection = selection.filter(id => !items.has(id))

    this.setSelection(newSelection)
  }

  /**
   * Check whether or not an
   * item is in the selection
   * @param { String } item The id of an item to check
   * @returns { Boolean }
   */
  isSelected (item) {
    const selection = this.#selection
    if (!selection) {
      return false
    }
    return selection.includes(item)
  }

  /**
   * Clear the current selection
   */
  async clearSelection () {
    this.#selection = []

    this.#client?.assertIdentity()
    await this.#props.State.apply({
      _connections: {
        [this.#client.getIdentity()]: {
          selection: { $delete: true }
        }
      }
    })

    this.#props.Events.emitLocally('selection', [], DEFAULT_SELECTION_EVENT_STATE)
  }

  /**
   * Get the current selection
   * @returns { Promise.<String[]> }
   */
  async getSelection () {
    return this.#selection
  }
}

DIController.main.register('Selection', Selection, [
  'State',
  'Events',
  'Commands'
])

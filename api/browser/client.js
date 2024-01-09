// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const MissingIdentityError = require('../error/MissingIdentityError')
const state = require('../state')

/**
 * The client's
 * current identity
 * @type { String? }
 */
let _identity

/**
 * @private
 * Set the client's identity
 * @param { String } identity
 */
function setIdentity (identity) {
  _identity = identity
}

/**
 * Get the current identity
 * @returns { String? }
 */
function getIdentity () {
  return _identity
}

/**
 * @private
 * Assert that an identity is set,
 * will throw an error if not
 */
function assertIdentity () {
  if (!getIdentity()) {
    throw new MissingIdentityError()
  }
}

/**
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
 */
function setSelection (item) {
  assertIdentity()

  const items = ensureArray(item)
  state.apply({
    _connections: {
      [getIdentity()]: {
        selection: { $replace: items }
      }
    }
  })
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
function addSelection (item) {
  assertIdentity()

  const items = ensureArray(item)
    /*
    Only add items that are
    not already selected
    */
    .filter(item => !isSelected(item))

  const currentSelectionIsArray = Array.isArray(state.getLocalState()?._connections?.[getIdentity()]?.selection)

  if (!currentSelectionIsArray) {
    state.apply({
      _connections: {
        [getIdentity()]: {
          selection: { $replace: items }
        }
      }
    })
  } else {
    state.apply({
      _connections: {
        [getIdentity()]: {
          selection: { $push: items }
        }
      }
    })
  }
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
function subtractSelection (item) {
  assertIdentity()

  const selection = state.getLocalState()?._connections?.[getIdentity()]?.selection
  if (!selection) {
    return
  }

  const items = new Set(ensureArray(item))
  const newSelection = selection.filter(id => !items.has(id))

  setSelection(newSelection)
}

/**
 * Check whether or not an
 * item is in the selection
 * @param { String } item The id of an item to check
 * @returns { Boolean }
 */
function isSelected (item) {
  assertIdentity()
  const selection = state.getLocalState()?._connections?.[getIdentity()]?.selection
  if (!selection) {
    return false
  }
  return selection.includes(item)
}

/**
 * Clear the current selection
 */
function clearSelection () {
  assertIdentity()

  state.apply({
    _connections: {
      [getIdentity()]: {
        selection: { $delete: true }
      }
    }
  })
}

/**
 * Get the current selection
 * @returns { Promise.<String[]> }
 */
async function getSelection () {
  assertIdentity()
  return (await state.get(`_connections.${getIdentity()}.selection`)) || []
}

module.exports = {
  setIdentity,
  getIdentity,
  setSelection,
  getSelection,
  addSelection,
  subtractSelection,
  clearSelection,
  isSelected
}

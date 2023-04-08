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
 * Select an item,
 * will replace the
 * current selection
 * @param { String } item A string to select
 *//**
 * Select multiple items,
 * will replace the
 * current selection
 * @param { String[] } items Multiple items to select
 */
function setSelection (item) {
  assertIdentity()

  let items = item
  if (!Array.isArray(item)) {
    items = [item]
  }

  state.apply({
    [getIdentity()]: {
      selection: { $replace: items }
    }
  })
}

/**
 * Clear the current selection
 */
function clearSelection () {
  assertIdentity()

  state.apply({
    [getIdentity()]: {
      selection: { $delete: true }
    }
  })
}

/**
 * Get the current selection
 * @returns { Promise.<String[]> }
 *
 * @todo: Rewrite to use the local state
 */
function getSelection () {
  assertIdentity()
  return state.get(`${getIdentity()}.selection`) || []
}

module.exports = {
  setIdentity,
  getIdentity,
  setSelection,
  getSelection,
  clearSelection
}

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const MissingIdentityError = require('../error/MissingIdentityError')
const InvalidArgumentError = require('../error/InvalidArgumentError')
const state = require('../state')

const LazyValue = require('../classes/LazyValue')

/**
 * @typedef {{
 *  id: String,
 *  role: Number,
 *  heartbeat: Number,
 *  isPersistent: Boolean,
 *  isEditingLayout: Boolean
 * }} Connection
 */

/**
 * Roles that a
 * client can assume
 */
const ROLES = {
  satellite: 0,
  main: 1
}

/**
 * The client's
 * current identity
 * @type { LazyValue }
 */
const _identity = new LazyValue()

/**
 * @private
 * Set the client's identity
 * @param { String } identity
 */
function setIdentity (identity) {
  _identity.set(identity)
}

/**
 * Get the current identity
 * @returns { String? }
 */
function getIdentity () {
  return _identity.get()
}

/**
 * Await the identity to be set,
 * will return immediately if an
 * identity is already set
 * or otherwise return a
 * Promise
 * @returns { String | Promise.<String> }
 */
function awaitIdentity () {
  return _identity.getLazy()
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

/**
 * Get all clients
 * from the state
 * @returns { Promise.<Connection[]> }
 */
async function getAllConnections () {
  return Object.entries((await state.get('_connections')) || {})
    .map(([id, connection]) => ({
      id,
      ...connection,
      role: (connection.role == null ? ROLES.satellite : connection.role)
    }))
}

/**
 * Set the role of a
 * client by its id
 * @param { String } id
 * @param { Number } role
 */
async function setRole (id, role) {
  if (!id || typeof id !== 'string') {
    throw new InvalidArgumentError('Invalid argument \'id\', must be a string')
  }

  if (!Object.values(ROLES).includes(role)) {
    throw new InvalidArgumentError('Invalid argument \'role\', must be a valid role')
  }

  const set = {
    _connections: {
      [id]: {
        role
      }
    }
  }

  /*
  There can only be one client with the main role,
  if set, demote all other mains to satellite
  */
  if (role === ROLES.main) {
    (await getConnectionsByRole(ROLES.main))
      /*
      Don't reset the role of the
      connection we're currently setting
      */
      .filter(connection => connection.id !== id)
      .forEach(connection => { set._connections[connection.id] = { role: ROLES.satellite } })
  }

  state.apply(set)
}

/**
 * Get an array of all clients that
 * have assumed a certain role
 * @param { Number } role A valid role
 * @returns { Promise.<Connection[]> }
 */
async function getConnectionsByRole (role) {
  if (!Object.values(ROLES).includes(role)) {
    throw new InvalidArgumentError('Invalid argument \'role\', must be a valid role')
  }

  return (await getAllConnections())
    .filter(connection => connection.role === role)
}

module.exports = {
  roles: ROLES,
  setIdentity,
  getIdentity,
  awaitIdentity,
  setSelection,
  getSelection,
  addSelection,
  subtractSelection,
  clearSelection,
  isSelected,
  setRole,
  getAllConnections,
  getConnectionsByRole
}

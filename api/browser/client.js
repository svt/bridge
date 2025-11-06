// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const MissingIdentityError = require('../error/MissingIdentityError')
const InvalidArgumentError = require('../error/InvalidArgumentError')

const LazyValue = require('../../shared/LazyValue')
const DIController = require('../../shared/DIController')

/**
 * @typedef {{
 *  id: String,
 *  role: Number,
 *  heartbeat: Number,
 *  isPersistent: Boolean,
 *  isEditingLayout: Boolean
 * }} Connection
 *
 * @typedef {{
 *   caller: String
 * }} ClientSelectionState
 */

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

class Client {
  #props

  /**
   * Roles that a
   * client can assume
   */
  get ROLES () {
    return Object.freeze({
      satellite: 0,
      main: 1
    })
  }

  constructor (props) {
    this.#props = props
  }

  /**
   * The client's
   * current identity
   * @type { LazyValue }
   */
  #identity = new LazyValue()

  /**
   * @private
   * Set the client's identity
   * @param { String } identity
   */
  setIdentity (identity) {
    this.#identity.set(identity)
  }

  /**
   * Get the current identity
   * @returns { String? }
   */
  getIdentity () {
    return this.#identity.get()
  }

  /**
   * Await the identity to be set,
   * will return immediately if an
   * identity is already set
   * or otherwise return a
   * Promise
   * @returns { String | Promise.<String> }
   */
  awaitIdentity () {
    return this.#identity.getLazy()
  }

  /**
   * @private
   * Assert that an identity is set,
   * will throw an error if not
   */
  assertIdentity () {
    if (!this.getIdentity()) {
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
  * @param { String[] } item Multiple items to select
  * @param { ClientSelectionState } state An optional state to pass with the event
  */
  async setSelection (item, state = DEFAULT_SELECTION_EVENT_STATE) {
    this.assertIdentity()

    const items = ensureArray(item)
    await this.#props.State.apply({
      _connections: {
        [this.getIdentity()]: {
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
    this.assertIdentity()

    const currentSelection = await this.getSelection()
    const newSelectionSet = new Set(Array.isArray(currentSelection) ? currentSelection : [])
    const newItems = ensureArray(item)

    for (const item of newItems) {
      newSelectionSet.add(item)
    }

    const newSelection = Array.from(newSelectionSet.values())

    await this.#props.State.apply({
      _connections: {
        [this.getIdentity()]: {
          selection: { $replace: newSelection }
        }
      }
    })
    this.#props.Events.emitLocally('selection', newSelection, DEFAULT_SELECTION_EVENT_STATE)
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
    this.assertIdentity()

    const selection = this.#props.State.getLocalState()?._connections?.[this.getIdentity()]?.selection
    if (!selection) {
      return
    }

    const items = new Set(ensureArray(item))
    const newSelection = selection.filter(id => !items.has(id))

    this.setSelection(newSelection, newSelection)
  }

  /**
   * Check whether or not an
   * item is in the selection
   * @param { String } item The id of an item to check
   * @returns { Boolean }
   */
  async isSelected (item) {
    this.assertIdentity()
    const selection = await this.#props.State.get(`_connections.${this.getIdentity()}.selection`)
    if (!selection) {
      return false
    }
    return selection.includes(item)
  }

  /**
   * Clear the current selection
   */
  async clearSelection () {
    this.assertIdentity()

    await this.#props.State.apply({
      _connections: {
        [this.getIdentity()]: {
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
    this.assertIdentity()
    return (await this.#props.State.get(`_connections.${this.getIdentity()}.selection`)) || []
  }

  /**
   * Get all clients
   * from the this.#props.State
   * @returns { Promise.<Connection[]> }
   */
  async getAllConnections () {
    return Object.entries((await this.#props.State.get('_connections')) || {})
      .map(([id, connection]) => ({
        id,
        ...connection,
        role: (connection.role == null ? this.ROLES.satellite : connection.role)
      }))
  }

  /**
   * Set the role of a
   * client by its id
   * @param { String } id
   * @param { Number } role
   */
  async setRole (id, role) {
    if (!id || typeof id !== 'string') {
      throw new InvalidArgumentError('Invalid argument \'id\', must be a string')
    }

    if (!Object.values(this.ROLES).includes(role)) {
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
    if (role === this.ROLES.main) {
      (await this.getConnectionsByRole(this.ROLES.main))
        /*
        Don't reset the role of the
        connection we're currently setting
        */
        .filter(connection => connection.id !== id)
        .forEach(connection => { set._connections[connection.id] = { role: this.ROLES.satellite } })
    }

    this.#props.State.apply(set)
  }

  /**
   * Get an array of all clients that
   * have assumed a certain role
   * @param { Number } role A valid role
   * @returns { Promise.<Connection[]> }
   */
  async getConnectionsByRole (role) {
    if (!Object.values(this.ROLES).includes(role)) {
      throw new InvalidArgumentError('Invalid argument \'role\', must be a valid role')
    }

    return (await this.getAllConnections())
      .filter(connection => connection.role === role)
  }
}

DIController.main.register('Client', Client, [
  'State',
  'Events',
  'Commands'
])

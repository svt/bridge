// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const ApiError = require('../error/ApiError')
const MissingIdentityError = require('../error/MissingIdentityError')
const InvalidArgumentError = require('../error/InvalidArgumentError')

const LazyValue = require('../../shared/LazyValue')
const DIController = require('../../shared/DIController')

require('./clipboard')
require('./selection')

/**
 * @typedef {{
 *  id: String,
 *  role: Number,
 *  isEditingLayout: Boolean
 * }} Connection
 *
 * @typedef {{
 *   caller: String
 * }} ClientSelectionState
 */

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

  get selection () {
    return this.#props.Selection
  }

  get clipboard () {
    return this.#props.Clipboard
  }

  constructor (props) {
    this.#props = props
    this.#props.Selection.client = this
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
   * Register this instance as
   * a new client with the API
   * @returns
   */
  async registerClient () {
    if (this.getIdentity()) {
      throw new ApiError('This client has already been registered')
    }
    const id = await this.#props.Commands.executeCommand('client.registerClient')
    this.setIdentity(id)
    return id
  }

  /**
   * Remove this client from the API,
   * this should be called before the
   * client closes
   */
  removeClient () {
    this.assertIdentity()
    this.#props.Commands.executeCommand('client.removeClient', this.getIdentity())
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
  'Commands',
  'Clipboard',
  'Selection'
])

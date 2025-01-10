// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const MissingArgumentError = require('../error/MissingArgumentError')
const InvalidArgumentError = require('../error/InvalidArgumentError')

const DIController = require('../shared/DIController')

/**
 * @typedef {{
 *  id: String,
 *  role: Number,
 *  heartbeat: Number,
 *  isPersistent: Boolean,
 *  isEditingLayout: Boolean
 * }} Connection
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

  constructor (props) {
    this.#props = props
  }

  /**
   * Get all clients
   * from the state
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

  /**
   * Get the current selection
   * of a connection by its id
   * @param { String } connectionId
   * @returns { Promise.<String[]> }
   */
  async getSelection (connectionId) {
    if (!connectionId) {
      throw new MissingArgumentError('Missing required argument \'connectionId\'')
    }
    return (await this.#props.State.get(`_connections.${connectionId}.selection`)) || []
  }
}

DIController.main.register('Client', Client, [
  'State'
])

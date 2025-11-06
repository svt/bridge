// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../shared/DIController')

class Connection {
  #props
  #id

  constructor (props) {
    this.#props = props
  }

  async registerConnection () {
    /*
    If this connection already has an assigned
    id, attempt to reconnect
    */
    if (this.#id) {
      this.#props.Commands.executeCommand('connections.registerConnection', this.#id)
      return
    }

    /*
    Register a completely new id
    */
    const id = await this.#props.Commands.executeCommand('connections.registerConnection')
    this.#id = id
    this.#props.Client?.setIdentity(id)
    return id
  }

  removeConnection () {
    this.#props.Commands.executeCommand('connections.removeConnection')
  }

  heartbeat () {
    if (!this.#id) {
      return
    }
    this.#props.Commands.executeRawCommand('connections.heartbeat', this.#id)
  }
}

DIController.main.register('Connection', Connection, [
  'Client',
  'Commands'
])

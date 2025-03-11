// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SClient extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerCommand('client.heartbeat', this.heartbeat.bind(this))
  }

  heartbeat (connectionId) {
    this.props.SState.applyState({
      _connections: {
        [connectionId]: { heartbeat: Date.now() }
      }
    })
  }
}

DIController.main.register('SClient', SClient, [
  'SCommands',
  'SState'
])

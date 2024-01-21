// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const manifest = require('./package.json')

const Server = require('./lib/Server')
const UDPTransport = require('./lib/UDPTransport')

const handlers = require('./lib/handlers')

const Router = require('obj-router')
const router = new Router(handlers)

/**
 * The default server port,
 *
 * this will be used as the default
 * settings value if no other is provided
 *
 * @type { Number }
 */
const DEFAULT_SERVER_PORT = 8080

exports.activate = async () => {
  /**
   * A reference to the current server
   * @type { Server | undefined }
   */
  let server

  /**
   * Set up the server and start listen
   * on a specific port
   * @param { Number } port
   */
  function setupServer (port = DEFAULT_SERVER_PORT, address) {
    teardownServer()

    const transport = new UDPTransport()
    transport.listen(port, address)

    server = new Server(transport)
    server.on('message', async osc => {
      try {
        await router.execute(osc.address, osc)
      } catch (e) {
        console.log(e)
      }
    })
  }

  /**
   * Tear down the
   * current server
   */
  function teardownServer () {
    if (!server) {
      return
    }
    server.teardown()
    server = undefined
  }

  /**
   * A snapshot of the current
   * server configuration used
   * for diffing against state
   * updates
   * @type { String }
   */
  let serverConfigSnapshot

  /*
  Listen to state changes and compare
  the current server configuration

  Only set up the server if the
  configuration has changed
  */
  bridge.events.on('state.change', newState => {
    const serverConfig = newState?.plugins?.[manifest.name]?.settings.server
    if (serverConfigSnapshot !== JSON.stringify(serverConfig)) {
      serverConfigSnapshot = JSON.stringify(serverConfig)

      if (!serverConfig?.active) {
        teardownServer()
      } else {
        setupServer(serverConfig?.port, serverConfig?.bindToAll ? '0.0.0.0' : '127.0.0.1')
      }
    }
  })

  /*
  Set up the server on
  startup if active
  */
  const serverConfig = await bridge.state.get(`plugins.${manifest.name}.settings.server`)
  serverConfigSnapshot = JSON.stringify(serverConfig)
  if (serverConfig?.active) {
    setupServer(serverConfig?.port, serverConfig?.bindToAll ? '0.0.0.0' : '127.0.0.1')
  }

  /*
  Set defaults
  if missing
  */
  if (!serverConfig?.port) {
    bridge.state.apply({
      plugins: {
        [manifest.name]: {
          settings: {
            server: {
              port: DEFAULT_SERVER_PORT
            }
          }
        }
      }
    })
  }
}

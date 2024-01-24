// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

const Server = require('./lib/Server')
const UDPTransport = require('./lib/UDPTransport')

const handlers = require('./lib/handlers')

const Router = require('obj-router')
const router = new Router(handlers)

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'OSCPlugin' })

require('./lib/commands')

/**
 * The default server port,
 *
 * this will be used as the default
 * settings value if no other is provided
 *
 * @type { Number }
 */
const DEFAULT_SERVER_PORT = 8080

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OSC</title>
        <base href="/" />
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="${cssPath}" />
        <script src="${jsPath}" defer></script>
        <script>
          window.PLUGIN = ${JSON.stringify(
            {
              name: manifest.name
            }
          )}
        </script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `
  return await bridge.server.serveString(html)
}

exports.activate = async () => {
  logger.debug('Activating OSC plugin')

  const htmlPath = await initWidget()

  /*
  Register the targets setting as
  soon as the widget is setup
  */
  bridge.settings.registerSetting({
    title: 'Targets',
    group: 'OSC',
    description: 'Configure OSC targets',
    inputs: [
      { type: 'frame', uri: `${htmlPath}?path=settings/targets` }
    ]
  })

  bridge.types.registerType({
    id: 'bridge.osc.trigger',
    name: 'Trigger',
    category: 'OSC',
    inherits: 'bridge.types.delayable',
    properties: {
      target: {
        name: 'Target',
        type: 'string',
        'ui.group': 'OSC',
        'ui.uri': `${htmlPath}?path=inspector/target`
      },
      path: {
        name: 'Path',
        type: 'string',
        'ui.group': 'OSC'
      },
      type: {
        name: 'Type',
        type: 'enum',
        enum: [
          'String',
          'Integer',
          'Float',
          'Boolean'
        ],
        default: 'String',
        'ui.group': 'OSC'
      },
      value: {
        name: 'Value',
        type: 'string',
        'ui.group': 'OSC'
      }
    }
  })

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

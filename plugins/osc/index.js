// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const osc = require('osc-min')

const assets = require('../../assets.json')
const manifest = require('./package.json')

const Server = require('./lib/Server')
const UDPClient = require('./lib/UDPClient')
const UDPTransport = require('./lib/UDPTransport')
const TCPTransport = require('./lib/TCPTransport')

const handlers = require('./lib/handlers')
const commands = require('./lib/commands')
const types = require('./lib/types')

const Router = require('obj-router')
const router = new Router(handlers)

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'OSCPlugin' })

require('./lib/commands')

/**
 * @typedef {{
 *  id: String,
 *  data: {
 *    osc: {
 *      target: String,
 *      address: String,
 *      value: String,
 *      type: String
 *    }
 *  }
 * }} OSCTriggerItem
 */

/**
 * The default server port,
 *
 * this will be used as the default
 * settings value if no other is provided
 *
 * @type { Number }
 */
const DEFAULT_SERVER_PORT = 8080

/**
 * Declare the valid types
 * that an OSC argument can adopt
 *
 * @type { String[] }
 */
const VALID_OSC_ARG_TYPES = ['string', 'integer', 'float', 'boolean']

const SERVER_MODES = {
  1: 'udp',
  2: 'tcp'
}

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

/**
 * Check if a value is
 * considered 'truthy'
 * @param { String | Number | Boolean | Object } value
 * @returns
 */
function isTruthy (value) {
  const normalised = String(value).toLowerCase()
  if (normalised === 'false' || normalised === 'f') {
    return false
  }
  return !!value
}

/**
 * Parse a value according
 * to an argument type
 * @param { String } type
 * @param { any } value
 * @returns { Boolean }
 */
function parseAsArgumentType (type, value) {
  if (!(VALID_OSC_ARG_TYPES.includes(type))) {
    return undefined
  }

  switch (type) {
    case 'string':
      return String(value)
    case 'integer':
      return parseInt(value)
    case 'float':
      return parseFloat(value)
    case 'boolean':
      return isTruthy(value)
  }
}

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
function setupServer (port = DEFAULT_SERVER_PORT, address, mode) {
  teardownServer()

  let transport
  if (mode === 'udp') {
    transport = new UDPTransport()
  } else if (mode === 'tcp') {
    transport = new TCPTransport()
  }

  transport.listen(port, address)

  server = new Server(transport)
  server.on('message', async osc => {
    try {
      await router.execute(osc.address, osc)
    } catch (e) {
      logger.warn('Failed to execute command', osc.address)
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
 * Play an item that's an OSC trigger by
 * extracting its data and send it as an
 * OSC message over a socket
 * @param { OSCTriggerItem } item
 * @returns { Promise.<void> }
 */
async function playTrigger (item) {
  const targetId = item?.data?.osc?.target
  if (!targetId) {
    return
  }

  /*
  Find the target and make
  sure that it exists
  */
  const target = await commands.getTarget(targetId)
  if (!target) {
    logger.error('OSC target was not found')
    return
  }

  /*
  Construct a message object
  and create a buffer from it
  that can be sent directly
  over the socket
  */
  const data = item?.data?.osc
  const type = String(data?.type).toLowerCase()

  if (!type || !(VALID_OSC_ARG_TYPES.includes(type))) {
    logger.error('Invalid OSC argument type')
    return
  }

  const message = osc.toBuffer({
    address: data?.address,
    args: [{
      type,
      value: parseAsArgumentType(type, data?.value)
    }]
  })

  UDPClient.send(target?.host, target?.port, message)
}

exports.activate = async () => {
  logger.debug('Activating OSC plugin')

  const htmlPath = await initWidget()

  /*
  Register the
  plugin's types
  */
  types.init(htmlPath)

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

  /*
  Listen for playing items
  and handle OSC triggers
  */
  bridge.events.on('item.play', async item => {
    if (item?.type === 'bridge.osc.trigger') {
      playTrigger(item)
    }
  })

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

      if (!serverConfig?.mode) {
        teardownServer()
      } else {
        setupServer(serverConfig?.port, serverConfig?.bindToAll ? '0.0.0.0' : '127.0.0.1', SERVER_MODES[serverConfig?.mode])
      }
    }
  })

  /*
  Set up the server on
  startup if active
  */
  const serverConfig = await bridge.state.get(`plugins.${manifest.name}.settings.server`)
  serverConfigSnapshot = JSON.stringify(serverConfig)
  if (serverConfig?.mode) {
    setupServer(serverConfig?.port, serverConfig?.bindToAll ? '0.0.0.0' : '127.0.0.1', SERVER_MODES[serverConfig?.mode])
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

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
const log = require('./lib/log')

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
 * The default server port for the UDP transport
 *
 * this will be used as the default
 * settings value if no other is provided
 *
 * @type { Number }
 */
const DEFAULT_UDP_SERVER_PORT = 8080

/**
 * The default server port for the TCP transport
 *
 * this will be used as the default
 * settings value if no other is provided
 *
 * @type { Number }
 */
const DEFAULT_TCP_SERVER_PORT = 8081

/**
 * Declare the valid types
 * that an OSC argument can adopt
 *
 * @type { String[] }
 */
const VALID_OSC_ARG_TYPES = ['string', 'integer', 'float', 'boolean']

const SERVER_TYPES = {
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
 * A reference to the current servers
 * indexed by their type
 * @type { Server | undefined }
 */
const servers = {}

/**
 * Set up the server and start listen
 * on a specific port
 * @param { Number } port
 */
function setupServer (type, port, address) {
  teardownServer(type)

  let transport
  let defaultPort

  if (type === 'udp') {
    transport = new UDPTransport()
    defaultPort = DEFAULT_UDP_SERVER_PORT
  } else if (type === 'tcp') {
    transport = new TCPTransport()
    defaultPort = DEFAULT_TCP_SERVER_PORT
  }

  transport.on('error', err => {
    logger.warn(err)
  })
  transport.listen(port || defaultPort, address)

  servers[type] = new Server(transport)
  servers[type].on('message', async osc => {
    try {
      log.addLog({
        timestamp: Date.now(),
        direction: 'in',
        address: osc.address
      })
      await router.execute(osc.address, osc)
    } catch (e) {
      logger.warn('Failed to execute command', osc.address)
    }
  })
}

/**
 * Tear down the
 * current server
 * by its type
 */
function teardownServer (type) {
  if (!servers[type]) {
    return
  }
  servers[type].teardown()
  servers[type] = undefined
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
  const type = VALID_OSC_ARG_TYPES[parseInt(data?.type)]

  if (!type) {
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
  log.addLog({
    timestamp: Date.now(),
    direction: 'out',
    address: data?.address
  })
}

function updateServerConfig (type, set) {
  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          [type]: set
        }
      }
    }
  })
}

/**
 * Create a status message indicating
 * that the server status changed
 * @param { 'tcp' | 'udp' } type
 * @param { Boolean } active
 */
function createServerStatusMessage (type, active) {
  bridge.messages.createTextMessage({
    text: `OSC: ${active ? 'Starting' : 'Stopping'} ${type} server`
  })
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
  Register the
  log widget
  */
  bridge.widgets.registerWidget({
    id: 'bridge.plugins.osc.log',
    name: 'OSC log',
    uri: `${htmlPath}?path=widget/log`,
    description: 'Log the most recent incoming OSC traffic'
  })

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
    switch (item?.type) {
      case 'bridge.osc.trigger':
        playTrigger(item)
        break
      case 'bridge.osc.udp.activate':
        updateServerConfig('udp', {
          active: item?.data?.osc?.active
        })
        createServerStatusMessage('udp', item?.data?.osc?.active)
        break
      case 'bridge.osc.tcp.activate':
        updateServerConfig('tcp', {
          active: item?.data?.osc?.active
        })
        createServerStatusMessage('tcp', item?.data?.osc?.active)
        break
    }
  })

  /**
   * A snapshot of the current
   * server configurations used
   * for diffing against state
   * updates
   * @type { String }
   */
  const serverConfigSnapshots = {}

  /*
  Listen to state changes and compare
  the current server configuration

  Only set up the server if the
  configuration has changed
  */
  bridge.events.on('state.change', newState => {
    const settings = newState?.plugins?.[manifest.name]?.settings

    for (const type of Object.values(SERVER_TYPES)) {
      const config = settings?.[type]

      if (serverConfigSnapshots[type] !== JSON.stringify(config)) {
        serverConfigSnapshots[type] = JSON.stringify(config)

        if (!config?.active) {
          teardownServer(type)
        } else {
          setupServer(type, config?.port, config?.bindToAll ? '0.0.0.0' : '127.0.0.1')
        }
      }
    }
  })

  const settings = await bridge.state.get(`plugins.${manifest.name}.settings`)

  /*
  Set up servers on
  startup if active
  */
  for (const type of Object.values(SERVER_TYPES)) {
    const config = settings?.[type]
    if (!config?.active) {
      teardownServer(type)
    } else {
      setupServer(type, config?.port, config?.bindToAll ? '0.0.0.0' : '127.0.0.1')
    }
  }

  /*
  Set defaults
  if missing
  */
  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          udp: {
            port: settings?.udp?.port || DEFAULT_UDP_SERVER_PORT
          },
          tcp: {
            port: settings?.tcp?.port || DEFAULT_TCP_SERVER_PORT
          }
        }
      }
    }
  })
}

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  host: String,
 *  port: Number
 * }} ConnectionDescription
 *
 * @typedef {{
 *  id: String?,
 *  name: String,
 *  host: String,
 *  port: Number
 * }} ServerDescription
 */

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const uuid = require('uuid')

const assets = require('../../assets.json')
const manifest = require('./package.json')

const Caspar = require('./lib/Caspar')

const CasparManager = require('./lib/CasparManager')
const casparManager = new CasparManager()

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'CasparPlugin' })

const STATE_SETTINGS_PATH = `plugins.${manifest.name}`

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Clock</title>
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
 * Initiate the default settings
 * if no settings are set
 */
async function initSettings () {
  if (await bridge.state.get(`plugins.${manifest.name}.settings`) !== undefined) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          servers: []
        }
      }
    }
  })
}

/**
 * Setup a server instance
 * from an init-object,
 * also adding references to
 * it in the required parts
 * of the state
 * @param { ServerDescription } description
 */
async function setupServer (description) {
  if (!description.id) {
    return
  }

  const server = new Caspar({
    reconnect: true
  })

  server.on('status', newStatus => {
    bridge.state.apply({
      _tmp: {
        [manifest.name]: {
          servers: {
            [description.id]: {
              status: newStatus
            }
          }
        }
      }
    })
  })

  casparManager.add(description.id, server)

  if (description.host && description.port) {
    server.connect(description.host, description.port)
  }
}

/**
 * Initialize all servers that are stored
 * in the serializable part of the state,
 * that is server descriptions without
 * the connection state data
 *
 * This must be done once
 * on plugin activation
 */
async function initStoredServers () {
  /**
   * @type { ServerDescription[] }
   */
  const servers = await bridge.state.get(`${STATE_SETTINGS_PATH}.servers`) || []

  for (const server of servers) {
    await setupServer(server)
  }
}

exports.activate = async () => {
  const htmlPath = await initWidget()
  await initSettings()
  await initStoredServers()

  bridge.settings.registerSetting({
    title: 'Server',
    group: 'Caspar CG',
    description: 'Configure Caspar servers',
    inputs: [
      { type: 'frame', uri: `${htmlPath}?path=settings/servers` }
    ]
  })

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.caspar.status',
    name: 'Caspar status',
    uri: `${htmlPath}?path=status`,
    description: 'A widget displaying the servers\' statuses'
  })

  bridge.events.on('play', e => {
    console.log('Caspar playing', e)
  })

  /**
   * Add a new server
   * from an init-object
   * @param { ServerDescription } description
   * @returns { Promise.<String> } A promise resolving
   *                               to the server's id
   */
  async function addServer (description) {
    logger.debug('Adding server')

    /*
    Generate a new id for
    referencing the server
    */
    description.id = uuid.v4()

    await setupServer(description)

    const serverArray = await bridge.state.get(`${STATE_SETTINGS_PATH}.servers`) || []
    if (serverArray.length > 0) {
      bridge.state.apply({
        plugins: {
          [manifest.name]: {
            servers: { $push: [description] }
          }
        }
      })
    } else {
      bridge.state.apply({
        plugins: {
          [manifest.name]: {
            servers: [description]
          }
        }
      })
    }

    return description.id
  }
  bridge.commands.registerCommand('caspar.server.add', addServer)

  /**
   * Update the state from
   * a new description
   * @param { String } serverId The id of the server to edit
   * @param { ServerDescription } description A new server init object
   *                                  to apply to the server
   */
  async function editServer (serverId, description) {
    logger.debug('Editing server', serverId)

    const server = casparManager.get(serverId)
    if (!server) {
      throw new Error('Server not found')
    }

    const serverArray = await bridge.state.get(`${STATE_SETTINGS_PATH}.servers`) || []
    const newServerArray = [...serverArray]
      .map(server => {
        if (server.id !== serverId) {
          return server
        }
        return description
      })

    bridge.state.apply({
      plugins: {
        'bridge-plugin-caspar': {
          servers: { $replace: newServerArray }
        }
      }
    })
  }
  bridge.commands.registerCommand('caspar.server.edit', editServer)

  /**
   * Reconnect a server using
   * a new connection init
   * @param { String } serverId The id of the server to reconnect
   * @param { ConnectionDescription } description An object describing the new connection
   */
  async function connectServer (serverId, description) {
    logger.debug('Connecting server', serverId)

    const server = casparManager.get(serverId)
    if (!server) {
      return Promise.reject(new Error('Server not found'))
    }

    if (description.host && description.port) {
      server.connect(description.host, description.port)
    }
  }
  bridge.commands.registerCommand('caspar.server.connect', connectServer)

  /**
   * Remove a server by its id,
   * will also disconnect any
   * current connections
   * @param { String } serverId The id of the
   *                            server to remove
   */
  async function removeServer (serverId) {
    logger.debug('Removing server', serverId)

    const server = casparManager.get(serverId)
    if (!server) {
      return Promise.reject(new Error('Server not found'))
    }

    server.teardown()
    casparManager.remove(serverId)

    const serverArray = await bridge.state.get(`${STATE_SETTINGS_PATH}.servers`) || []
    const newServerArray = [...serverArray]
      .filter(server => server.id !== serverId)

    bridge.state.apply([
      {
        _tmp: {
          [manifest.name]: {
            servers: {
              [serverId]: { $delete: true }
            }
          }
        }
      },
      {
        plugins: {
          'bridge-plugin-caspar': {
            servers: { $replace: newServerArray }
          }
        }
      }
    ])
  }
  bridge.commands.registerCommand('caspar.server.remove', removeServer)
}

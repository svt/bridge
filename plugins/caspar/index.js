// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

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
        <base href="/"></base>
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

async function setupServer (serverInit) {
  if (!serverInit.id) {
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
            [serverInit.id]: {
              status: newStatus
            }
          }
        }
      }
    })
  })

  casparManager.add(serverInit.id, server)

  if (serverInit.host && serverInit.port) {
    server.connect(serverInit.host, serverInit.port)
  }
}

async function initStoredServers () {
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

  bridge.commands.registerCommand('caspar.addServer', async serverInit => {
    logger.debug('Adding server', serverInit.id)
    await setupServer(serverInit)

    const serverArray = await bridge.state.get(`${STATE_SETTINGS_PATH}.servers`) || []
    if (serverArray.length > 0) {
      bridge.state.apply({
        plugins: {
          [manifest.name]: {
            servers: { $push: [serverInit] }
          }
        }
      })
    } else {
      bridge.state.apply({
        plugins: {
          [manifest.name]: {
            servers: [serverInit]
          }
        }
      })
    }
  })

  bridge.commands.registerCommand('caspar.editServer', async (serverId, serverInit) => {
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
        return serverInit
      })

    bridge.state.apply({
      plugins: {
        'bridge-plugin-caspar': {
          servers: { $replace: newServerArray }
        }
      }
    })
  })

  bridge.commands.registerCommand('caspar.connectServer', async (serverId, host, port) => {
    logger.debug('Connecting server', serverId)

    const server = casparManager.get(serverId)
    if (!server) {
      throw new Error('Server not found')
    }

    if (host && port) {
      server.connect(host, port)
    }
  })

  bridge.commands.registerCommand('caspar.removeServer', async serverId => {
    logger.debug('Removing server', serverId)

    const server = casparManager.get(serverId)
    if (!server) {
      throw new Error('Server not found')
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
  })
}

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

const paths = require('./lib/paths')
const assets = require('../../assets.json')
const manifest = require('./package.json')

const types = require('./lib/types')
const commands = require('./lib/commands')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'CasparPlugin' })

/*
Bootstrap item handlers that
listens for play events
*/
require('./lib/handlers')

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Caspar</title>
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
  const servers = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.servers`) || []

  for (const server of servers) {
    await commands.setupServer(server)
  }
}

/*
Activate the plugin and
bootstrap its contributions
*/
exports.activate = async () => {
  logger.debug('Activating caspar plugin')

  const htmlPath = await initWidget()
  await initSettings()
  await initStoredServers()

  types.init(htmlPath)

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

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.caspar.library',
    name: 'Library',
    uri: `${htmlPath}?path=library`,
    description: 'The media library for Caspar CG'
  })

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.caspar.liveSwitch',
    name: 'Live switch',
    uri: `${htmlPath}?path=liveSwitch`,
    description: 'Control the live status of Caspar CG'
  })
}

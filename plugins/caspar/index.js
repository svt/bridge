// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

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

exports.activate = async () => {
  const appPath = await initWidget()
  initSettings()

  bridge.settings.registerSetting({
    title: 'Server',
    group: 'Caspar CG',
    description: 'Configure Caspar servers',
    inputs: [
      { type: 'frame', uri: `${appPath}?path=settings/servers` }
    ]
  })

  bridge.events.on('play', e => {
    console.log('Caspar playing', e)
  })
}

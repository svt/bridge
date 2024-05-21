// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

const types = require('./lib/types')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'ATEM Plugin' })

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ATEM</title>
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
  Register the
  plugin's types
  */
  types.init(htmlPath)

  /*
  Register the targets setting as
  soon as the widget is setup
  */
  bridge.settings.registerSetting({
    title: 'Devices',
    group: 'ATEM',
    description: 'Configure ATEM devices',
    inputs: [
      { type: 'frame', uri: `${htmlPath}?path=settings/devices` }
    ]
  })
}

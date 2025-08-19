// SPDX-FileCopyrightText: 2024 Sveriges Television AB
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
        <title>Button</title>
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

  const htmlPath = await bridge.server.serveString(html)

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.button.play',
    name: 'Play button',
    uri: `${htmlPath}?path=play`,
    description: 'A button playing an item',
    supportsFloat: true
  })

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.button.stop',
    name: 'Stop button',
    uri: `${htmlPath}?path=stop`,
    description: 'A button stopping an item',
    supportsFloat: true
  })
}

exports.activate = async () => {
  bridge.commands.registerCommand('bridge.plugins.clock.time', echo => ({ echo, time: Date.now() }))
  initWidget()
}

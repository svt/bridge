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

  const htmlPath = await bridge.server.serveString(html)

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.clock.latency',
    name: 'Command latency',
    uri: `${htmlPath}?view=latency`,
    description: 'A widget showing the latency between commands sent to the main thread',
    supportsFloat: true
  })

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.clock.time',
    name: 'Current time',
    uri: `${htmlPath}?view=time`,
    description: 'A widget showing the current time',
    supportsFloat: true
  })
}

exports.activate = async () => {
  bridge.commands.registerCommand('bridge.plugins.clock.time', echo => ({ echo, time: Date.now() }))
  initWidget()
}

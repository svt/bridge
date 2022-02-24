// Copyright © 2021 SVT Design
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
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Getting started</title>
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="/${assets.hash}.${manifest.name}.bundle.css" />
        <script src="/${assets.hash}.${manifest.name}.bundle.js" defer></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `

  const htmlPath = await bridge.server.serveString(html)
  bridge.widgets.registerWidget('bridge.plugins.welcome', 'Getting started', htmlPath)
}

exports.activate = async () => {
  initWidget()
}

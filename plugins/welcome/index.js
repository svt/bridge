/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const bridge = require('bridge')

const assets = require('../../assets.json')

async function initWidget () {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Getting started</title>
        <link rel="stylesheet" href="/${assets.hash}.bridge.plugin.welcome.bundle.css" />
        <script src="/${assets.hash}.bridge.plugin.welcome.bundle.js" defer></script>
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

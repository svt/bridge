/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
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
        <link rel="stylesheet" href="${cssPath}" />
        <script src="${jsPath}" defer></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `

  const htmlPath = await bridge.server.serveString(html)

  bridge.widgets.registerWidget('bridge.plugins.clock.latency', 'Command latency', `${htmlPath}?view=latency`)
  bridge.widgets.registerWidget('bridge.plugins.clock.time', 'Current time', `${htmlPath}?view=time`)
}

exports.activate = async () => {
  bridge.commands.registerCommand('bridge.plugins.clock.time', echo => ({ echo, time: Date.now() }))
  initWidget()
}

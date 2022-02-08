/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */
/*
const manifest = require('./manifest.json')
const assets = require('../../assets.json')
 */
const path = require('path')
const bridge = require('bridge')

async function initMyWidget () {
  const stylePath = await bridge.server.serveFile(path.join(__dirname, 'style.css'))

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>My widget</title>
        <link rel="stylesheet" href="${stylePath}" />
      </head>
      <body>
        <h1>Test</h1>
      </body>
    </html>
  `

  const htmlPath = await bridge.server.serveString(html)
  bridge.widgets.registerWidget('rundown', 'Rundown', htmlPath)
}

exports.activate = async () => {
  bridge.state.apply({
    title: 'Titel satt från plugin'
  })

  initMyWidget()
}

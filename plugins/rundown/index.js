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
  console.log('HTML', htmlPath)
  bridge.widgets.registerWidget('myWidget', htmlPath)
}

exports.activate = async () => {
  bridge.state.apply({
    title: 'Titel satt från plugin'
  })

  let i = 0
  setInterval(() => {
    i++
    bridge.state.apply({
      title: i
    })
  }, 1000)

  initMyWidget()

  /*
  Should this function write the HTML to a file and wrap the serveFile function
  rather than sending the contents over the API?

  The widget object in the state could just
  contain the URL in that case such that

  [State]: {
    _widgets: {
      [id]: {
        name: 'My widget',
        url: '/api/v1/serve/hash
      }
    }
  }
  */
  bridge.widgets.registerWidget('bridge.plugins.rundown.rundown', 'Rundown', () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Widget</title>
        </head>
        <body>
          A test body
        </body>
      </html>
    `
  })

  /*
    context.component.register('rundown', new RundownComponent())
    const url = context.file.serve(`/dist/${assets.hash}.${context.manifest.bundle}.bundle.js`)
    console.log(url)
  */
}

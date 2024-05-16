const bridge = require('bridge')

/*
The exported 'activate' function is the plugin's initialization function,
it will be called when the plugin is loaded and every time a workspace
is opened
*/
exports.activate = async () => {
  /*
  Create a new widget by serving either a file
  or a string through Bridge's web server,

  this way Bridge will ensure that it's reachable
  within the desktop app as well as in browsers

  Use the stylesheet provided by Bridge
  to match the interface and automatically
  apply the current theme
  */
  const htmlPath = await bridge.server.serveString(`
    <html>
      <head>
        <title>My widget</title>
        <base href="/"></base>
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
      </head>
      <body>
        Hello World
      </body>
    </html>
  `)

  /*
  Next, register a new widget
  This will make the widget appear
  in the Bridge interface
  */
  bridge.widgets.registerWidget({
    id: 'bridge.plugins.helloWorld',
    name: 'Hello World',
    uri: htmlPath,
    description: 'Hello World widget'
  })
}

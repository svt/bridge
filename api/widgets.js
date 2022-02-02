/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  serveFile: serveFile
 * }} WidgetsApi
 */

const commands = require('./commands')

/**
 * Serve a static file
 * through the web server
 * @param { String } filePath An absolute path to the file to serve
 * @returns { String } A path to the file as served by the web server
 */
function serveFile (filePath) {
  return commands.executeCommand('widgets.serveFile', filePath)
    .then(hash => `/api/v1/serve/${hash}`)
}
exports.serveFile = serveFile

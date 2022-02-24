// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const commands = require('./commands')

/**
 * Access uris for
 * static assets
 * @type { String }
 */
exports.uris = Object.freeze({
  STYLE_RESET: '/bridge.bundle.css'
})

/**
 * Serve a static file
 * through the web server
 * @param { String } filePath An absolute path to the file to serve
 * @returns { Promise.<String> } A path to the file as served by the web server
 */
function serveFile (filePath) {
  return commands.executeCommand('server.serveFile', filePath)
    .then(hash => `/api/v1/serve/${hash}`)
}
exports.serveFile = serveFile

/**
 * Serve a string as a static file
 * through the web server
 * @param { String } str A string to serve as a file
 * @returns { Promise.<String> } A path to the file as served by the web server
 */
function serveString (str) {
  return commands.executeCommand('server.serveString', str)
    .then(hash => `/api/v1/serve/${hash}`)
}
exports.serveString = serveString

/**
 * Stop serving a file through
 * the web server by its id
 * @param { String } id
 * @returns { Promise.<Boolean> }
 */
function unserve (id) {
  return commands.executeCommand('server.unserve', id)
}
exports.unserve = unserve

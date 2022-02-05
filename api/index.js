/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 * @description This is the entrypoint for the extension api of Bridge,
 *              which is consumed by internal as well as external plugins
 *
 * @typedef {{
 *  widgets: widgets,
 *  server: server
 * }} Api
 */

const transport = require('./transport')
const commands = require('./commands')
const widgets = require('./widgets')
const server = require('./server')
const state = require('./state')

/**
 * The api entrypoint
 * exposed to plugins
 * @type { Api }
 */
const api = {
  transport,
  commands,
  widgets,
  server,
  state
}

module.exports = api

/*
Expose the api as window.bridge
if we're running in a browser
*/
if (typeof window !== 'undefined') {
  window.bridge = api
}

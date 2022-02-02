/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 * @description This is the entrypoint for the extension api of Bridge,
 *              which is consumed by internal as well as external plugins
 *
 * @typedef {{
 *  widgets: widgets
 * }} Api
 */

const commands = require('./commands')
const widgets = require('./widgets')
const state = require('./state')

/**
 * The api entrypoint
 * exposed to plugins
 * @type { Api }
 */
const api = {
  commands,
  widgets,
  state
}

module.exports = api

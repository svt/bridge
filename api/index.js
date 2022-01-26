/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 * @description This is the entrypoint for the extension api of Bridge,
 *              which is consumed by internal as well as external plugins
 */

const commands = require('./commands')
const state = require('./state')

const api = {
  commands,
  state
}

module.exports = api

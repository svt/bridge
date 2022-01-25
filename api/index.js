/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 * @description This is the entrypoint for the extension api of Bridge,
 *              which is consumed by internal as well as external plugins
 */

const communicator = require('./communicator')

const api = {
  communicator
}

module.exports = api

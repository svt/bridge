/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  onMessage: ((Any) => Void) => Void,
 *  send: (Any) => Void
 * }} Communicator
 */

const communicator = (function () {
  if (module.parent) {
    console.log('[API] Using node communicator')
    return require('./node/communicator')
  }
  if (typeof window !== 'undefined') {
    console.log('[API] Using browser communicator')
    return require('./browser/communicator')
  }
})()

module.exports = communicator

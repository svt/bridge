/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  onMessage: ((Any) => Void) => Void,
 *  send: (Any) => Void
 * }} Communicator
 */

const transport = (function () {
  if (module.parent) {
    console.log('[API] Using node transport')
    return require('./node/transport')
  }
  if (typeof window !== 'undefined') {
    console.log('[API] Using browser transport')
    return require('./browser/transport')
  }
})()

module.exports = transport

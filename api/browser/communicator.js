/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 * @description An implementation of the communicator for
 *              running in iFrames in browsers, using postMessage
 */

/**
  * @type { import('../communicator').Communicator }
  */
module.exports = {
  onMessage: handler => window.addEventListener('message', handler),
  send: msg => {
    console.log('[API] Sending', msg)
    window.parent.postMessage(msg)
  }
}

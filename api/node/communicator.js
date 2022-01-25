/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const { parentPort } = require('worker_threads')

/**
 * @type { import('../communicator').Communicator }
 */
module.exports = {
  onMessage: handler => parentPort.on('message', handler),
  send: msg => parentPort.postMessage(msg)
}

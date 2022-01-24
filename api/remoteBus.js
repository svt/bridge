/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

function emit (event, ...args) {
  /*
    1. Find the correct kernel
    2. Send a message as { type: 'emit', args: args }
  */
}
exports.emit = emit

function on (event, handler) {
  /*
    1. Find the correct kernel
    2. Send a message as { type: 'on', args: [event] }
    3. Wait for incoming events and if the correct event type, call the handler
  */
}
exports.on = on

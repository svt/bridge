/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const bus = require('./remoteBus')

function trigger (command, ...args) {
  /*
  1. Emit an event with the command and payload
  2. Send event to the event bus
  3. Event bus broadcasts to clients (can we limit this to only broadcast to the correct client?)
  4. The client with the registered command takes action
  */
  bus.emit(command, ...args)
}
exports.trigger = trigger

function register (command, handler) {
  bus.emit('on', command)
  bus.on(command, handler)
}
exports.register = register

function registerAsync (command, handler) {

}
exports.registerAsync = registerAsync

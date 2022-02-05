/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 * @description An implementation of the transport for
 *              running in browsers, some methods should
 *              be overridden and some should be called
 *              by the consumer of this api
 */

const handlers = []

/**
  * @type { import('../transport').Communicator }
  */
module.exports = {
  onMessage: handler => handlers.push(handler),

  /**
   * Send a message with the
   * transport, for messages
   * leaving the api
   *
   * This should be overridden by the
   * application to deliver messages
   * correctly
   *
   * @param { Object } message
   */
  send: message => {},

  /**
   * The entrypoint for messages
   * coming into the api
   *
   * This should be called by the application
   * when a new message is to be handled
   *
   * @param { Object } message
   */
  receive: message => handlers.forEach(handler => handler(message))
}

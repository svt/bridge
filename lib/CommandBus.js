/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const EventBus = require('events')

/**
 * @class CommandBus
 * @description An event bus used for commands
 *              throughout the application
 */
class CommandBus extends EventBus {
  /**
   * Get the singleton instance
   * of this class
   * @returns { CommandBus }
   */
  static getInstance () {
    if (!this._instance) {
      this._instance = new CommandBus()
    }
    return this._instance
  }

  /**
   * Emit a command with
   * some arbitrary data
   * @param { String } command The identifier of
   *                           the command to emit
   * @param { Object } data Any data to
   *                        include in the event
   */
  emit (command, data) {
    super.emit(command, data)
    super.emit('*', data)
  }
}
module.exports = CommandBus

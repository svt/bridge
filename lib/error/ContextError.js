/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

class ContextError extends Error {
  constructor (message, code, status) {
    super(message)
    this.name = 'ContextError'
    this.code = code
    this.status = status
  }
}

module.exports = ContextError

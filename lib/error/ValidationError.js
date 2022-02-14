/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

class ValidationError extends Error {
  constructor (message, code, params) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.params = params
  }
}

module.exports = ValidationError

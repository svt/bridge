/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

class ApiError extends Error {
  constructor (message, code) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

module.exports = ApiError

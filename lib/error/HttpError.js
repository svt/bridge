/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

class HttpError extends Error {
  constructor (message, code, status) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.status = status
  }
}

module.exports = HttpError

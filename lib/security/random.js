const crypto = require('node:crypto')

/**
 * Get secure random string
 * @param { number } bytes The length of the string in bytes
 * @returns { string }
 */
function string (bytes) {
  return Buffer.from(crypto.randomBytes(bytes)).toString('hex')
}
exports.string = string

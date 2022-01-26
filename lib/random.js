/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 */

const crypto = require('crypto')

const DEFAULT_CHARACTER_MAP = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Generate a random string of
 * characters in the map
 * @param { Number } length The length of the returned string
 * @param { String } map A string of characters to include
 *                       in the returned string
 * @returns { String }
 *//**
 * Generate a random string
 * @param { Number } length The length of the returned string
 * @returns { String }
 */
function string (length = 10, map = DEFAULT_CHARACTER_MAP) {
  const bytes = crypto.randomBytes(length)
  return bytes.map(val => map[val % map.length])
}
exports.string = string

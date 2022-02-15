/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

class MissingTypeError extends Error {
  constructor () {
    super('No such type exists')
    this.name = 'MissingTypeError'
    this.code = 'ERR_TYPE_MISSING_TYPE'
  }
}

module.exports = MissingTypeError

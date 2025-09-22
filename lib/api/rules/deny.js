const PolicyError = require('../../error/PolicyError')

module.exports = reason => {
  return () => {
    throw new PolicyError('Policy denied', reason)
  }
}

module.exports.REASON = {
  INCORRECT_CONTEXT: 'INCORRECT_CONTEXT'
}

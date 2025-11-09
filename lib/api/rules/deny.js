const PolicyError = require('../../error/PolicyError')

module.exports = (code, message) => {
  return () => {
    throw new PolicyError('Policy denied', code, message)
  }
}

module.exports.CODE = {
  INCORRECT_CONTEXT: 'INCORRECT_CONTEXT',
  BAD_DATA: 'BAD_DATA'
}

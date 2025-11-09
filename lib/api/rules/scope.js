const deny = require('./deny')

exports.require = scope => {
  return input => {
    if (typeof input.scope !== 'string') {
      deny(deny.REASON.BAD_DATA)()
    }
    const scopes = input.scope.split(' ')
    if (scopes.indexOf(scope) === -1) {
      deny('MISSING_SCOPE', `Missing required scope: ${scope}`)()
    }
    return true
  }
}

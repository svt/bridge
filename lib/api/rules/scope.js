const deny = require('./deny')

exports.require = scope => {
  return input => {
    if (typeof input?.context?.scope !== 'string') {
      deny(deny.CODE.BAD_DATA)()
    }
    const scopes = input?.context?.scope?.split(' ')
    if (scopes.indexOf(scope) === -1) {
      deny('MISSING_SCOPE', `Missing required scope: ${scope}`)()
    }
    return true
  }
}

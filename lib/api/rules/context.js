const deny = require('./deny')

exports.mustBeType = type => {
  return input => {
    if (input.ctx.type !== type) {
      deny(deny.REASON.INCORRECT_CONTEXT)()
    }
  }
}

exports.clientIsElectronMainWindow = () => {
  return input => {
    return true
  }
}

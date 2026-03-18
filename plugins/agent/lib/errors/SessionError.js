class SessionError extends Error {
  static get code () {
    return Object.freeze({
      ERR_MISSING_MODEL: 'ERR_MISSING_MODEL'
    })
  }

  constructor (msg, code) {
    super(msg)
    this.name = 'SessionError'
    this.code = code
  }
}
module.exports = SessionError

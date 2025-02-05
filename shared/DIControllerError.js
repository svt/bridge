class DIControllerError extends Error {
  constructor (msg) {
    super(msg)
    this.name = DIControllerError
  }
}

module.exports = DIControllerError

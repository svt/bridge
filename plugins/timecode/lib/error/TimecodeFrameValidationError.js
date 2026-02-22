class TimecodeFrameValidationError extends Error {
  constructor (message) {
    super(message)
    this.name = 'TimecodeFrameValidationError'
  }
}
module.exports = TimecodeFrameValidationError

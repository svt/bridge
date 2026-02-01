const DIBase = require('../../../shared/DIBase')

class TimecodeDevice extends DIBase {
  compareTo (spec) {
    throw new Error('Subclass has not implemented the compareTo method, this is a requirement for all TimecodeDevice subclasses')
  }
}
module.exports = TimecodeDevice

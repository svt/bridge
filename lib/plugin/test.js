const bridge = require('bridge')
const test1 = require('./test1')

exports.init = () => {
  console.log('Test', bridge)
  test1.init()
}

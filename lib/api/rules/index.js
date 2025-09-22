const { should } = require('node-policy-agent')
const context = require('./context')

module.exports = [
  [
    should.matchRegex('$input.command', /^window\..+$/),
    context.mustBeType('client'),
    context.clientIsElectronMainWindow()
  ],

  /*
  Allow all commands by default
  */
  [
    () => true
  ]
]

const { should } = require('node-policy-agent')
const scope = require('./scope')

module.exports = [
  [
    should.matchRegex('$input.command', /^window\..+$/),
    scope.require('api:window.*')
  ],

  /*
  Allow all commands by default
  */
  [
    () => true
  ]
]

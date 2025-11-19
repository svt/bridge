const { should } = require('node-policy-agent')
const scope = require('./scope')
const deny = require('./deny')

module.exports = [
  [
    should.matchRegex('$input.command', /^window\..+$/),
    scope.require('api:window.*'),
    /*
    Verify that the sub-field of the context
    matches the first argument of the command,
    which is the id of the window to act on

    If no id is provided as an argument,
    allow the request as it should be for a command
    that does not require an id, and if it does,
    the command will fail anyway
    */
    input => {
      if (input?.args?.[0] && input?.context?.sub !== input.args[0]) {
        return deny('INCORRECT_SUBJECT', 'The context subject is not authorized for this operation')()
      }
      return true
    }
  ],

  /*
  Allow all commands by default
  */
  [
    () => true
  ]
]

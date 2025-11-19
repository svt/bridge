const { should } = require('node-policy-agent')
const scope = require('./scope')
const deny = require('./deny')

module.exports = [
  /*
  Allow window.close, window.toggleMaximize and window.minimize
  only if the client has scope api:window.* and its token
  is signed with the subject set to the id of the window
  it tries to modify
  */
  [
    should.matchRegex('$input.command', /^window\.(close|toggleMaximize|minimize)/),
    scope.require('api:window.*'),
    /*
    Verify that the sub-field of the context
    matches the first argument of the command,
    which is the id of the window to act on
    */
    input => {
      if (input?.context?.sub !== input.args[0]) {
        return deny('INCORRECT_SUBJECT', 'The context subject is not authorized for this operation')()
      }
      return true
    }
  ],

  /*
  Allow all commands beginning with 'window.' if
  the client is authorized for scope api:window.*
  */
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

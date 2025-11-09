// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')

require('./SAuth')
require('./SItems')
require('./SState')
require('./STypes')
require('./SClient')
require('./SEvents')
require('./SServer')
require('./SSystem')
require('./SWindow')
require('./SSettings')
require('./SCommands')
require('./SMessages')
require('./SShortcuts')
require('./SVariables')

/**
 * This is the base class
 * for the server API (SAPI)
 */
class SAPI {
  constructor (props) {
    this.shortcuts = props.SShortcuts
    this.variables = props.SVariables
    this.commands = props.SCommands
    this.messages = props.SMessages
    this.settings = props.SSettings
    this.events = props.SEvents
    this.client = props.SClient
    this.server = props.SServer
    this.system = props.SSystem
    this.window = props.SWindow
    this.items = props.SItems
    this.state = props.SState
    this.types = props.STypes
    this.auth = props.SAuth
  }
}

DIController.main.register('SAPI', SAPI, [
  'SShortcuts',
  'SVariables',
  'SCommands',
  'SMessages',
  'SSettings',
  'SEvents',
  'SClient',
  'SServer',
  'SSystem',
  'SWindow',
  'STypes',
  'SState',
  'SItems',
  'SAuth'
])

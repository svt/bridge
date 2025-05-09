// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../shared/DIController')

require('./transport')
require('./variables')
require('./shortcuts')
require('./commands')
require('./messages')
require('./settings')
require('./widgets')
require('./client')
require('./events')
require('./server')
require('./system')
require('./state')
require('./types')
require('./items')

class API {
  constructor (props) {
    this.transport = props.Transport
    this.variables = props.Variables
    this.shortcuts = props.Shortcuts
    this.commands = props.Commands
    this.messages = props.Messages
    this.settings = props.Settings
    this.widgets = props.Widgets
    this.client = props.Client
    this.events = props.Events
    this.server = props.Server
    this.system = props.System
    this.state = props.State
    this.types = props.Types
    this.items = props.Items
  }
}

DIController.main.register('API', API, [
  'Transport',
  'Variables',
  'Shortcuts',
  'Commands',
  'Messages',
  'Settings',
  'Widgets',
  'Client',
  'Events',
  'Server',
  'System',
  'State',
  'Types',
  'Items'
])

const main = DIController.main.instantiate('API')

module.exports = main

/*
Expose the api as window.bridge
if we're running in a browser
*/
if (typeof window !== 'undefined') {
  window.bridge = main
}

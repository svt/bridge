// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../shared/DIController')

require('./transport')
require('./variables')
require('./shortcuts')
require('./commands')
require('./settings')
require('./widgets')
require('./client')
require('./events')
require('./server')
require('./state')
require('./types')
require('./items')

class API {
  constructor (props) {
    this.transport = props.Transport
    this.variables = props.Variables
    this.shortcuts = props.Shortcuts
    this.commands = props.Commands
    this.settings = props.Settings
    this.widgets = props.Widgets
    this.client = props.Client
    this.events = props.Events
    this.server = props.Server
    this.state = props.State
    this.types = props.Types
    this.items = props.Items
  }
}

DIController.main.register('API', API, [
  'Variables',
  'Shortcuts',
  'Commands',
  'Settings',
  'Widgets',
  'Client',
  'Events',
  'Server',
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

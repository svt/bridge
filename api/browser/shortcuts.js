// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const Shortcuts = require('../shared/shortcuts')

const InvalidArgumentError = require('../error/InvalidArgumentError')

const COMMAND_IDENTIFIER = 'command:'

class ClientShortcuts extends Shortcuts {
  dispatchShortcut (action) {
    if (typeof action !== 'string') {
      throw new InvalidArgumentError('Shortcut action must be a string')
    }

    /*
    If the action is a command, that is, starting with 'command:',
    execute it rather than emitting the shortcut event
    */
    if (action.startsWith(COMMAND_IDENTIFIER)) {
      const command = action.substring(COMMAND_IDENTIFIER.length)
      this.props.Commands.executeCommand(command)
    } else {
      this.props.Events.emitLocally('shortcut', action)
    }
  }
}

DIController.main.register('Shortcuts', ClientShortcuts, [
  /*
  This list must include requirements
  from the base Shortcuts class
  */
  'State',
  'Events',
  'Commands'
])
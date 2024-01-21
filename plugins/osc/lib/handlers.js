// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

/*
Define any available osc paths
*/
module.exports = {
  '/api': {
    '/commands': {
      '/executeCommand': message => bridge.commands.executeCommand(...message.args.map(arg => arg.value))
    },
    '/items': {
      '/playItem': message => bridge.items.playItem(message?.args?.[0].value),
      '/stopItem': message => bridge.items.stopItem(message?.args?.[0].value)
    }
  }
}

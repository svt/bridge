// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

async function getMainSelection () {
  const connections = await bridge.client.getConnectionsByRole(bridge.client.roles.main)
  return connections[0]?.selection || []
}

async function playSelection () {
  const selection = await getMainSelection()
  for (const id of selection) {
    bridge.items.playItem(id)
  }
}

async function stopSelection () {
  const selection = await getMainSelection()
  for (const id of selection) {
    bridge.items.stopItem(id)
  }
}

async function playItemsWithTag (tag) {
  const items = await bridge.state.get('items')
  for (const [id, item] of Object.entries(items)) {
    if (item.data?.tag !== tag) {
      continue
    }
    bridge.items.playItem(id)
  }
}

async function stopItemsWithTag (tag) {
  const items = await bridge.state.get('items')
  for (const [id, item] of Object.entries(items)) {
    if (item.data?.tag !== tag) {
      continue
    }
    bridge.items.stopItem(id)
  }
}

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
      '/stopItem': message => bridge.items.stopItem(message?.args?.[0].value),
      '/tags': {
        ':tag': {
          '/play': message => playItemsWithTag(message.params.tag),
          '/stop': message => stopItemsWithTag(message.params.tag)
        }
      }
    },
    '/client': {
      '/selection': {
        '/play': message => playSelection(),
        '/stop': message => stopSelection()
      }
    }
  }
}

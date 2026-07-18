// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/* eslint-env jest */

jest.mock('bridge', () => ({
  state: { get: jest.fn() },
  types: { getType: jest.fn() },
  items: {
    createItem: jest.fn(),
    applyItem: jest.fn(),
    itemExists: jest.fn(),
    deleteItems: jest.fn()
  },
  commands: {
    executeCommand: jest.fn()
  }
}))

const bridge = require('bridge')
const registerTools = require('./index')

function setupHandlers () {
  const handlers = {}
  const server = {
    mcpServer: {
      registerTool: (name, _definition, handler) => {
        handlers[name] = handler
      }
    }
  }

  const session = {
    addAuthDetailForTool: jest.fn()
  }

  registerTools(server, session)
  return handlers
}

beforeEach(() => {
  jest.clearAllMocks()
})

module.exports = {
  bridge,
  setupHandlers
}

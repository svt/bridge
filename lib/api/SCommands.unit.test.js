// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

require('./SCommands')
require('../workspace/Workspace')

const DIController = require('../../shared/DIController')

let commands

beforeAll(() => {
  const workspace = DIController.main.instantiate('Workspace', {
    WorkspaceSockets: {},
    WorkspaceCrypto: {},
    WindowStore: {}
  })

  commands = DIController.main.instantiate('SCommands', {
    Workspace: workspace
  })
})

test('register a non returning command', () => {
  function handler () {}

  expect(commands.hasCommand('non-returning-command')).toEqual(false)
  commands.registerCommand('non-returning-command', handler)
  expect(commands.hasCommand('non-returning-command')).toEqual(true)
})

test('register and execute an async command', async () => {
  function handler () {
    return 'this-is-an-async-response'
  }
  commands.registerAsyncCommand('async-command', handler)

  function transaction (res) {
    expect(res).toEqual('this-is-an-async-response')
  }

  commands.registerCommand('transaction', transaction)
  commands.executeCommand('async-command', 'transaction')
})

test('remove command', () => {
  commands.registerCommand('remove-command', () => {}, '1')
  expect(commands.hasCommand('remove-command')).toBe(true)
  commands.removeCommand('remove-command')
  expect(commands.hasCommand('remove-command')).toBe(false)
})

test('remove all commands by owner', () => {
  commands.registerCommand('owned-command', () => {}, '1')
  expect(commands.hasCommand('owned-command')).toBe(true)
  commands.removeAllByOwner('1')
  expect(commands.hasCommand('owned-command')).toBe(false)
})
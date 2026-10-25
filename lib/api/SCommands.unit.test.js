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
  commands.registerCommand('remove-command', () => {}, undefined, '1')
  expect(commands.hasCommand('remove-command')).toBe(true)
  commands.removeCommand('remove-command')
  expect(commands.hasCommand('remove-command')).toBe(false)
})

test('remove all commands by owner', () => {
  commands.registerCommand('owned-command', () => {}, undefined, '1')
  expect(commands.hasCommand('owned-command')).toBe(true)
  commands.removeAllByOwner('1')
  expect(commands.hasCommand('owned-command')).toBe(false)
})
test('list only exposed commands', () => {
  commands.registerCommand('listed-command', () => {}, { description: 'Listed', exposed: true })
  commands.registerCommand('hidden-command', () => {}, { description: 'Hidden' })

  const ids = commands.list().map(c => c.id)
  expect(ids).toContain('listed-command')
  expect(ids).not.toContain('hidden-command')
  expect(ids).not.toContain('non-returning-command')
})

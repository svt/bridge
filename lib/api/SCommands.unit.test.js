// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

require('./SCommands')

const DIController = require('../../shared/DIController')

let commands
beforeAll(() => {
  commands = DIController.main.instantiate('SCommands')
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
// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

require('./events')

const DIController = require('../shared/DIController')

let events
beforeAll(() => {
  events = DIController.main.instantiate('Events', {
    Commands: {
      registerCommand: () => {},
      executeCommand: () => {}
    }
  })
})

test('create a new callee scope', () => {
  const scope = events.createScope('myCallee')
  expect(scope.id).toEqual('myCallee')
})

test('remove all listeners for a callee', () => {
  const scope = events.createScope('mySecondCallee')
  scope.on('test', () => {})
  expect(events.removeAllListeners('mySecondCallee')).toEqual(1)
})

test('remove all intercepts for a callee', () => {
  const scope = events.createScope('myThirdCallee')
  scope.intercept('test', () => {})
  expect(events.removeAllIntercepts('myThirdCallee')).toEqual(1)
})

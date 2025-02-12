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

test('create a new caller scope', () => {
  const scope = events.createScope('mycaller')
  expect(scope.id).toEqual('mycaller')
})

test('remove all listeners for a caller', () => {
  const scope = events.createScope('mySecondcaller')
  scope.on('test', () => {})
  expect(events.removeAllListeners('mySecondcaller')).toEqual(1)
})

test('remove all intercepts for a caller', () => {
  const scope = events.createScope('myThirdcaller')
  scope.intercept('test', () => {})
  expect(events.removeAllIntercepts('myThirdcaller')).toEqual(1)
})

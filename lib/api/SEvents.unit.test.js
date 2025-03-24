// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

require('./SEvents')
require('./SCommands')

const DIController = require('../../shared/DIController')

let events
beforeAll(() => {
  events = DIController.main.instantiate('SEvents')
})

test('register and execute an event handler', () => {
  events.on('myEvent', data => {
    expect(data).toBe('foo')
  })
  events.emit('myEvent', 'foo')
})

test('remove all handlers by owner', () => {
  events.on('mySecondEvent', () => {}, '1')
  expect(events.hasHandlersForEvent('mySecondEvent')).toBe(true)
  events.removeAllByOwner('1')
  expect(events.hasHandlersForEvent('mySecondEvent')).toBe(false)
})

test('off', () => {
  const id = events.on('myThirdEvent', () => {})
  expect(events.hasHandlersForEvent('myThirdEvent')).toBe(true)
  events.off('myThirdEvent', id)
  expect(events.hasHandlersForEvent('myThirdEvent')).toBe(false)
})

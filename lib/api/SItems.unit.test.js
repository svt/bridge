// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

require('./SItems')

const DIController = require('../../shared/DIController')

/**
 * Create a fresh set of mock dependencies
 * and a new SItems instance for each test
 */
function makeInstance () {
  const registeredCommands = {}

  const SCommands = {
    registerAsyncCommand: jest.fn((name, fn) => { registeredCommands[name] = fn }),
    executeCommand: jest.fn()
  }

  const SEvents = {
    emit: jest.fn()
  }

  const SState = {
    applyState: jest.fn()
  }

  const Workspace = {
    state: { data: { items: {} } }
  }

  const instance = DIController.main.instantiate('SItems', {
    SCommands,
    SEvents,
    SState,
    Workspace
  })

  return { instance, SCommands, SEvents, SState, registeredCommands }
}

describe('playItem', () => {
  test('throws when item has no id', () => {
    const { instance } = makeInstance()
    expect(() => instance.playItem({})).toThrow()
    expect(() => instance.playItem(null)).toThrow()
  })

  test('aborts any existing play scheduler for the item', () => {
    const { instance, SCommands } = makeInstance()
    instance.playItem({ id: 'abc' })

    expect(SCommands.executeCommand).toHaveBeenCalledWith(
      'scheduler.abort', undefined, 'play:abc'
    )
  })

  test('sets state to playing with didStartPlayingAt and willStartPlayingAt', () => {
    const { instance, SState } = makeInstance()
    const before = Date.now()
    instance.playItem({ id: 'abc' })
    const after = Date.now()

    expect(SState.applyState).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.objectContaining({
          abc: expect.objectContaining({
            state: 'playing',
            didStartPlayingAt: expect.any(Number),
            willStartPlayingAt: expect.any(Number)
          })
        })
      })
    )

    const applied = SState.applyState.mock.calls[0][0].items.abc
    expect(applied.didStartPlayingAt).toBeGreaterThanOrEqual(before)
    expect(applied.didStartPlayingAt).toBeLessThanOrEqual(after)
  })

  test('emits item.play with the item', () => {
    const { instance, SEvents } = makeInstance()
    const item = { id: 'abc' }
    instance.playItem(item)

    expect(SEvents.emit).toHaveBeenCalledWith('item.play', item)
  })

  test('schedules endItem when item has a positive duration', () => {
    const { instance, SCommands } = makeInstance()
    const item = { id: 'abc', data: { duration: 5000 } }
    instance.playItem(item)

    expect(SCommands.executeCommand).toHaveBeenCalledWith(
      'scheduler.delay', undefined, 'end:abc', 5000, 'items.endItem', item
    )
  })

  test('aborts end scheduler and fires endItem immediately when item has no duration', () => {
    const { instance, SCommands, SEvents } = makeInstance()
    const item = { id: 'abc' }
    instance.playItem(item)

    expect(SCommands.executeCommand).toHaveBeenCalledWith(
      'scheduler.abort', undefined, 'end:abc'
    )
    expect(SEvents.emit).toHaveBeenCalledWith('item.end', item)
  })

  test('aborts end scheduler and fires endItem immediately when duration is zero', () => {
    const { instance, SCommands, SEvents } = makeInstance()
    const item = { id: 'abc', data: { duration: 0 } }
    instance.playItem(item)

    expect(SCommands.executeCommand).toHaveBeenCalledWith(
      'scheduler.abort', undefined, 'end:abc'
    )
    expect(SEvents.emit).toHaveBeenCalledWith('item.end', item)
  })

  test('registers items.playItem as an async command', () => {
    const { registeredCommands } = makeInstance()
    expect(typeof registeredCommands['items.playItem']).toBe('function')
  })
})

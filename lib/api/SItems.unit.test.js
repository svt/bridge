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

describe('seekItem', () => {
  test('throws when item has no id', () => {
    const { instance } = makeInstance()
    expect(() => instance.seekItem({}, 1000)).toThrow()
    expect(() => instance.seekItem(null, 1000)).toThrow()
  })

  test('does not emit item.play', () => {
    const { instance, SEvents } = makeInstance()
    instance.seekItem({ id: 'abc', data: { duration: 10000 } }, 3000)

    const playEmits = SEvents.emit.mock.calls.filter(([event]) => event === 'item.play')
    expect(playEmits).toHaveLength(0)
  })

  test('sets state to playing with timestamps offset by positionMs', () => {
    const { instance, SState } = makeInstance()
    const positionMs = 3000
    const before = Date.now()
    instance.seekItem({ id: 'abc', data: { duration: 10000 } }, positionMs)
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
    expect(applied.willStartPlayingAt).toBeGreaterThanOrEqual(before - positionMs)
    expect(applied.willStartPlayingAt).toBeLessThanOrEqual(after - positionMs)
  })

  test('aborts any existing end scheduler before rescheduling', () => {
    const { instance, SCommands } = makeInstance()
    instance.seekItem({ id: 'abc', data: { duration: 10000 } }, 3000)

    expect(SCommands.executeCommand).toHaveBeenCalledWith(
      'scheduler.abort', undefined, 'end:abc'
    )
  })

  test('schedules endItem at the remaining duration after seek', () => {
    const { instance, SCommands } = makeInstance()
    const item = { id: 'abc', data: { duration: 10000 } }
    instance.seekItem(item, 3000)

    expect(SCommands.executeCommand).toHaveBeenCalledWith(
      'scheduler.delay', undefined, 'end:abc', 7000, 'items.endItem', item
    )
  })

  test('immediately fires endItem when seek position is at or past the total duration', () => {
    const { instance, SEvents } = makeInstance()
    const item = { id: 'abc', data: { duration: 5000 } }
    instance.seekItem(item, 5000)

    expect(SEvents.emit).toHaveBeenCalledWith('item.end', item)
  })

  test('immediately fires endItem when item has no duration', () => {
    const { instance, SEvents } = makeInstance()
    const item = { id: 'abc' }
    instance.seekItem(item, 0)

    expect(SEvents.emit).toHaveBeenCalledWith('item.end', item)
  })

  test('registers items.seekItem as an async command', () => {
    const { registeredCommands } = makeInstance()
    expect(typeof registeredCommands['items.seekItem']).toBe('function')
  })
})

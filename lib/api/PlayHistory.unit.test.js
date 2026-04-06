// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const PlayHistory = require('./PlayHistory')

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

test('does not flag a single play', () => {
  const history = new PlayHistory()
  expect(history.record('a')).toBe(false)
})

test('does not flag a non-repeating sequence', () => {
  const history = new PlayHistory()
  expect(history.record('a')).toBe(false)
  expect(history.record('b')).toBe(false)
  expect(history.record('c')).toBe(false)
  expect(history.record('d')).toBe(false)
})

test('detects a single-item runaway loop', () => {
  const history = new PlayHistory()
  history.record('a')
  expect(history.record('a')).toBe(true)
})

test('detects a two-item runaway loop', () => {
  const history = new PlayHistory()
  history.record('a')
  history.record('b')
  history.record('a')
  expect(history.record('b')).toBe(true)
})

test('detects a multi-item runaway loop', () => {
  const history = new PlayHistory()
  const cycle = ['a', 'b', 'c', 'd', 'e']

  for (const id of cycle) {
    history.record(id)
  }

  let detected = false
  for (const id of cycle) {
    if (history.record(id)) {
      detected = true
      break
    }
  }

  expect(detected).toBe(true)
})

test('does not flag a single item played slowly', () => {
  const history = new PlayHistory()
  history.record('a')
  jest.advanceTimersByTime(100)
  expect(history.record('a')).toBe(false)
})

test('does not flag a timed loop where one step has a gap', () => {
  /*
  Simulates a group + 100ms media item cycle:
  group plays → media item plays (gap ~0ms) → item.end fires after 100ms → group plays again
  */
  const history = new PlayHistory()
  history.record('group')
  history.record('media')
  jest.advanceTimersByTime(100)
  history.record('group')
  expect(history.record('media')).toBe(false)
})

test('does not flag a sequence that only partially repeats', () => {
  const history = new PlayHistory()
  history.record('a')
  history.record('b')
  history.record('c')
  history.record('a')
  history.record('b')
  // a, b, c, a, b — not a full cycle of any length
  expect(history.record('d')).toBe(false)
})

test('delete() prevents loop detection for the removed item', () => {
  const history = new PlayHistory()
  history.record('a')
  history.record('b')
  history.delete('b')
  // Buffer is now just ['a']; playing a, b again should not trigger
  history.record('a')
  expect(history.record('b')).toBe(false)
})

test('delete() preserves loop detection for other items', () => {
  const history = new PlayHistory()
  history.record('a')
  history.record('b')
  history.delete('b')
  // 'a' is now the only entry; playing 'a' again completes a cycle
  expect(history.record('a')).toBe(true)
})

test('evicts oldest entry when window is full', () => {
  const windowSize = 10
  const history = new PlayHistory(windowSize)

  /*
  Fill the window with unique ids so it wraps around,
  then verify a fresh cycle is still detected
  */
  for (let i = 0; i < windowSize; i++) {
    history.record(`item-${i}`)
  }

  history.record('x')
  expect(history.record('x')).toBe(true)
})

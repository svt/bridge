// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const SavedState = require('./SavedState')

const state = new SavedState()

test('empty states are unchanged', () => {
  expect(state.hasChangedSinceLastSave()).toBe(false)
})

test('apply temporary key does not count as a change', () => {
  state.apply({
    _foo: { bar: 'baz' }
  })
  expect(state.hasChangedSinceLastSave()).toBe(false)

  state.apply({
    _baz: 'qux'
  })
  expect(state.hasChangedSinceLastSave()).toBe(false)
})

test('apply persistent key does count as a change and mark as save works', () => {
  state.apply({
    foo: { bar: 'baz' }
  })
  expect(state.hasChangedSinceLastSave()).toBe(true)

  state.markAsSaved()
  expect(state.hasChangedSinceLastSave()).toBe(false)

  state.apply({
    baz: 'qux'
  })
  expect(state.hasChangedSinceLastSave()).toBe(true)

  state.markAsSaved()
  expect(state.hasChangedSinceLastSave()).toBe(false)

  state.apply({
    0: 1
  })
  expect(state.hasChangedSinceLastSave()).toBe(true)

  state.markAsSaved()
  expect(state.hasChangedSinceLastSave()).toBe(false)
})

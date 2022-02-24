// SPDX-FileCopyrightText: 2022 Sveriges Television AB

//
// SPDX-License-Identifier: MIT

const State = require('./State')

afterEach(() => {
  State.getInstance().clear()
})

test('apply a plain object', () => {
  State.getInstance().apply({ foo: 'bar' })
  expect(State.getInstance().data).toMatchObject({ foo: 'bar' })
})

test('apply an array', () => {
  State.getInstance().apply({ arr: [1, 2, 3] })
  expect(State.getInstance().data).toMatchObject({ arr: [1, 2, 3] })
})

test('has a timestamp', () => {
  expect(typeof State.getInstance().data.time).toBe('number')
})

test('clear the state', () => {
  State.getInstance().apply({ foo: 'bar' })
  State.getInstance().clear()
  expect(State.getInstance()).toEqual(expect.not.objectContaining({ foo: 'bar' }))
})

describe('replace and delete', () => {
  beforeEach(() => {
    State.getInstance().apply({
      arr: [1, 2, 3],
      foo: 'bar',
      nested: { object: { baz: 'qux' } }
    })
  })

  test('replace an array', () => {
    State.getInstance().apply({ arr: { $replace: [4, 5] } })
    expect(State.getInstance().data).toMatchObject({ arr: [4, 5] })
  })

  test('delete a key', () => {
    State.getInstance().apply({ nested: { object: { $delete: true } } })
    expect(State.getInstance().data).toMatchObject({ nested: {} })
  })
})

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const merge = require('./merge')

test('concat arrays', () => {
  const source = {
    foo: {
      arr: [1, 2, 3]
    }
  }

  const apply = {
    foo: {
      arr: { $push: [4, 5, 6] }
    }
  }

  expect(merge.deep(source, apply)).toMatchObject({
    foo: {
      arr: [1, 2, 3, 4, 5, 6]
    }
  })
})

test('replace array values', () => {
  const source = [1, 2, 3]

  /*
  Replace the value at
  index 1 of the array
  */
  const apply = []
  apply[1] = 4

  expect(merge.deep(source, apply)[1]).toEqual(apply[1])
})

test('invert boolean value', () => {
  const source = {
    myBoolean: false
  }

  const apply = {
    myBoolean: { $invert: true }
  }
  expect(merge.deep(source, apply).myBoolean).toEqual(true)
})

test('invert string value', () => {
  const source = {
    myBoolean: 'false'
  }

  const apply = {
    myBoolean: { $invert: true }
  }
  expect(merge.deep(source, apply).myBoolean).toEqual(false)
})

test('delete an existing key', () => {
  const source = {
    keep: 'yes',
    remove: 'goodbye'
  }

  const apply = {
    remove: { $delete: true }
  }

  const result = merge.deep(source, apply)
  expect(result.keep).toEqual('yes')
  expect(Object.prototype.hasOwnProperty.call(result, 'remove')).toEqual(false)
})

test('$delete on a new key does not write the keyword object to state', () => {
  const source = {}

  const apply = {
    willStartPlayingAt: { $delete: true }
  }

  const result = merge.deep(source, apply)
  expect(Object.prototype.hasOwnProperty.call(result, 'willStartPlayingAt')).toEqual(false)
})

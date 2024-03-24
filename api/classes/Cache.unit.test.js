// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Cache = require('./Cache')
const cache = new Cache(5)

test('cache a provider', () => {
  cache.cache('myKey', () => 10)
  expect(cache.get('myKey')).resolves.toBe(10)
})

test('respect the max entry count', () => {
  cache.cache('myKey1', () => 10)
  cache.cache('myKey2', () => 10)
  cache.cache('myKey3', () => 10)
  cache.cache('myKey4', () => 10)
  cache.cache('myKey5', () => 10)
  cache.cache('myKey6', () => 10)
  expect(cache.get('myKey1')).resolves.toBe(undefined)
})

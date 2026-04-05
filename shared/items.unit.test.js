// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const { getEffectiveDuration } = require('./items')

describe('getEffectiveDuration', () => {
  test('returns data.duration when neither inPoint nor outPoint are set', () => {
    expect(getEffectiveDuration({ data: { duration: 5000 } })).toBe(5000)
  })

  test('returns outPoint - inPoint when both are set', () => {
    expect(getEffectiveDuration({ data: { duration: 10000, inPoint: 2000, outPoint: 7000 } })).toBe(5000)
  })

  test('returns duration - inPoint when only inPoint is set', () => {
    expect(getEffectiveDuration({ data: { duration: 10000, inPoint: 3000 } })).toBe(7000)
  })

  test('returns outPoint when only outPoint is set (inPoint defaults to 0)', () => {
    expect(getEffectiveDuration({ data: { duration: 10000, outPoint: 6000 } })).toBe(6000)
  })

  test('returns 0 when item has no data', () => {
    expect(getEffectiveDuration({ data: {} })).toBe(0)
    expect(getEffectiveDuration(null)).toBe(0)
    expect(getEffectiveDuration(undefined)).toBe(0)
  })

  test('returns 0 when inPoint equals outPoint', () => {
    expect(getEffectiveDuration({ data: { duration: 5000, inPoint: 3000, outPoint: 3000 } })).toBe(0)
  })

  test('returns 0 when inPoint exceeds outPoint', () => {
    expect(getEffectiveDuration({ data: { duration: 5000, inPoint: 4000, outPoint: 2000 } })).toBe(0)
  })

  test('coerces string values to numbers', () => {
    expect(getEffectiveDuration({ data: { duration: '10000', inPoint: '2000', outPoint: '8000' } })).toBe(6000)
  })
})

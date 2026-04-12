import { calculateDurationMs, frameRateFractionToDecimal, frameRateFractionToDecimalRounded } from './asset.js'

test('calculateDurationMs should return 0 for 0 duration (string or number)', () => {
  // Test for both string and number '0'
  const itemString = { framerate: '1/25', duration: '0' }
  const itemNumber = { framerate: '1/25', duration: 0 }

  expect(calculateDurationMs(itemString)).toEqual(0)
  expect(calculateDurationMs(itemNumber)).toEqual(0)
})

test('calculateDurationMs should return default time for undefined or invalid duration', () => {
  // Test for undefined duration
  const itemUndefinedDuration = { framerate: '1/25', duration: undefined }
  const itemUndefined = undefined
  const itemInvalidDuration = { framerate: '1/25', duration: 'invalid' }

  expect(calculateDurationMs(itemUndefinedDuration)).toEqual(5000)
  expect(calculateDurationMs(itemUndefined)).toEqual(5000)
  expect(calculateDurationMs(itemInvalidDuration)).toEqual(5000)
})

test('calculateDurationMs should return default time for undefined framerate or invalid framerate', () => {
  // Test for undefined or invalid framerate
  const itemUndefinedFramerate = { framerate: undefined, duration: '0' }
  const itemInvalidFramerate = { framerate: '0/0', duration: '10' }

  expect(calculateDurationMs(itemUndefinedFramerate)).toEqual(5000)
  expect(calculateDurationMs(itemInvalidFramerate)).toEqual(5000)
})

test('calculateDurationMs should return adjusted time for negative duration', () => {
  const item = {
    framerate: '1/25',
    duration: '-100'
  }
  expect(calculateDurationMs(item)).toEqual(4000)
})

test('calculateDurationMs should return correct time for fractional framerate', () => {
  const item = {
    framerate: '1001/30000',
    duration: '30000'
  }
  expect(calculateDurationMs(item)).toEqual(1001000)
})

test('calculateDurationMs should return 0 for STILL image', () => {
  const item = {
    type: 'STILL',
    framerate: '1/25',
    duration: '100'
  }
  expect(calculateDurationMs(item)).toEqual(0)
})

// frameRateFractionToDecimal tests

test('frameRateFractionToDecimal should return correct value for even frame rates', () => {
  expect(frameRateFractionToDecimal('1/24')).toEqual(24)
  expect(frameRateFractionToDecimal('1/25')).toEqual(25)
  expect(frameRateFractionToDecimal('1/30')).toEqual(30)
  expect(frameRateFractionToDecimal('1/50')).toEqual(50)
  expect(frameRateFractionToDecimal('1/60')).toEqual(60)
})

test('frameRateFractionToDecimal should return correct value for odd (NTSC) frame rates', () => {
  expect(frameRateFractionToDecimal('1001/24000')).toBeCloseTo(23.976, 3)
  expect(frameRateFractionToDecimal('1001/30000')).toBeCloseTo(29.97, 2)
  expect(frameRateFractionToDecimal('1001/60000')).toBeCloseTo(59.94, 2)
})

test('frameRateFractionToDecimal should return undefined for non-numeric input', () => {
  expect(frameRateFractionToDecimal('abc/def')).toBeUndefined()
  expect(frameRateFractionToDecimal('foo')).toBeUndefined()
  expect(frameRateFractionToDecimal('')).toBeUndefined()
})

test('frameRateFractionToDecimal should return undefined when divisor is zero or negative', () => {
  expect(frameRateFractionToDecimal('0/25')).toBeUndefined()
  expect(frameRateFractionToDecimal('-1/25')).toBeUndefined()
})

test('frameRateFractionToDecimal should handle non-string input by coercing to string', () => {
  expect(frameRateFractionToDecimal(undefined)).toBeUndefined()
  expect(frameRateFractionToDecimal(null)).toBeUndefined()
})

// frameRateFractionToDecimalRounded tests

test('frameRateFractionToDecimalRounded should return a string rounded to 3 decimal places for even frame rates', () => {
  expect(frameRateFractionToDecimalRounded('1/24')).toEqual('24.000')
  expect(frameRateFractionToDecimalRounded('1/25')).toEqual('25.000')
  expect(frameRateFractionToDecimalRounded('1/30')).toEqual('30.000')
})

test('frameRateFractionToDecimalRounded should return a string rounded to 3 decimal places for odd (NTSC) frame rates', () => {
  expect(frameRateFractionToDecimalRounded('1001/24000')).toEqual('23.976')
  expect(frameRateFractionToDecimalRounded('1001/30000')).toEqual('29.970')
  expect(frameRateFractionToDecimalRounded('1001/60000')).toEqual('59.940')
})

test('frameRateFractionToDecimalRounded should return undefined for undefined or non-numeric input', () => {
  expect(frameRateFractionToDecimalRounded(undefined)).toBeUndefined()
  expect(frameRateFractionToDecimalRounded(null)).toBeUndefined()
  expect(frameRateFractionToDecimalRounded('abc/def')).toBeUndefined()
})

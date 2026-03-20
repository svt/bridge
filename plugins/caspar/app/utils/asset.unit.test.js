const { calculateDurationMs, millisecondsToTime } = require('./asset.cjs')

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

test('calculateDurationMs should return default time for non-numeric duration', () => {
  const item = {
    framerate: '1/25',
    duration: 'not-a-number'
  }
  expect(calculateDurationMs(item)).toEqual(5000)
})

test('returns "00:00" for 0 or negative input', () => {
  expect(millisecondsToTime(0)).toEqual('00:00')
  expect(millisecondsToTime(-100)).toEqual('00:00')
  expect(millisecondsToTime(null)).toEqual('00:00')
  expect(millisecondsToTime(undefined)).toEqual('00:00')
})

test('converts seconds correctly', () => {
  expect(millisecondsToTime(1000)).toEqual('00:01')
  expect(millisecondsToTime(61000)).toEqual('01:01')
})

test('converts hours correctly', () => {
  expect(millisecondsToTime(3600000)).toEqual('01:00:00')
  expect(millisecondsToTime(3661000)).toEqual('01:01:01')
})

test('handles arbitrary times', () => {
  expect(millisecondsToTime(7325000)).toEqual('02:02:05')
})

test('handles non-numeric input gracefully', () => {
  expect(millisecondsToTime('not-a-number')).toEqual('00:00')
  expect(millisecondsToTime({})).toEqual('00:00')
  expect(millisecondsToTime([])).toEqual('00:00')
})

test('handles large durations', () => {
  expect(millisecondsToTime(100 * 3600000)).toEqual('100:00:00')
})

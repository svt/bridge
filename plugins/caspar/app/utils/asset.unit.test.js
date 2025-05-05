const { calculateDurationMs } = require('./asset.cjs')

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

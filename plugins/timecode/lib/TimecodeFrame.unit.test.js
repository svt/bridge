const TimecodeFrame = require('./TimecodeFrame')
const TimecodeFrameValidationError = require('./error/TimecodeFrameValidationError')

test('calculates next frame', () => {
  const frame1 = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    frames: 1,
    smpte: '00:00:00:01'
  }
  expect(TimecodeFrame.next(frame1, 25)).toMatchObject({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    frames: 2,
    smpte: '00:00:00:02'
  })

  const frame2 = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    frames: 49,
    smpte: '00:00:00:49'
  }
  expect(TimecodeFrame.next(frame2, 50)).toMatchObject({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 1,
    frames: 0,
    smpte: '00:00:01:00'
  })

  const frame3 = {
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 4,
    frames: 5,
    smpte: '02:03:04:05'
  }
  expect(TimecodeFrame.next(frame3, 24)).toMatchObject({
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 4,
    frames: 6,
    smpte: '02:03:04:06'
  })

  const frame4 = {
    days: 1,
    hours: 23,
    minutes: 59,
    seconds: 59,
    frames: 29,
    smpte: '23:59:59:29'
  }
  expect(TimecodeFrame.next(frame4, 30)).toMatchObject({
    days: 2,
    hours: 0,
    minutes: 0,
    seconds: 0,
    frames: 0,
    smpte: '00:00:00:00' // All zeroes as days are not included in the SMTPE string
  })

  const frame5 = {
    days: 0,
    hours: 22,
    minutes: 59,
    seconds: 59,
    frames: 24,
    smpte: '22:59:59:24'
  }
  expect(TimecodeFrame.next(frame5, 25)).toMatchObject({
    days: 0,
    hours: 23,
    minutes: 0,
    seconds: 0,
    frames: 0,
    smpte: '23:00:00:00'
  })
})

test('validates frames', () => {
  const frame1 = {
    days: 0,
    hours: 22,
    minutes: 59,
    seconds: 59,
    frames: 24,
    smpte: '22:59:59:24'
  }
  expect(TimecodeFrame.validate(frame1, 25)).toBe(true)

  const frame2 = {
    // Missing days
    hours: 22,
    minutes: 59,
    seconds: 59,
    frames: 24,
    smpte: '22:59:59:24'
  }
  expect(() => TimecodeFrame.validate(frame2, 25)).toThrow(TimecodeFrameValidationError)

  const frame3 = {
    days: 0,
    hours: 22,
    minutes: 59,
    seconds: 59,
    frames: 24
    // Missing smpte string
  }
  expect(() => TimecodeFrame.validate(frame3, 50)).toThrow(TimecodeFrameValidationError)

  const frame4 = {
    days: 0,
    hours: 22,
    minutes: 59,
    seconds: 59,
    frames: 50, // Invalid frame count
    smpte: '00:00:00:00'
  }
  expect(() => TimecodeFrame.validate(frame4, 50)).toThrow(TimecodeFrameValidationError)

  const frame5 = {
    days: 0,
    hours: 22,
    minutes: 59,
    seconds: 59,
    frames: 23,
    smpte: '010:00:00:00' // Invalid smpte string
  }
  expect(() => TimecodeFrame.validate(frame5, 25)).toThrow(TimecodeFrameValidationError)

  const frame6 = {
    days: 0,
    hours: 22,
    minutes: 59,
    seconds: 59,
    frames: 23,
    smpte: 'foo00:00:00' // Invalid smpte string
  }
  expect(() => TimecodeFrame.validate(frame6, 25)).toThrow(TimecodeFrameValidationError)
})
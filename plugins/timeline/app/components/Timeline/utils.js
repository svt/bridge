const DEFAULT_SECOND_WIDTH_PX = 100

const TIME_UNIT = {
  frame: 'frame',
  second: 'second',
  minute: 'minute',
  hour: 'hour'
}

export const UNIT_MS_DURATION = {
  frame: frameRate => 1000 / frameRate,
  second: () => 1000,
  minute: () => 60000,
  hour: () => 60000 * 60
}

export function getTimelineSpec (items) {
  return {
    frameRate: 50,
    duration: 10000,
    scale: 1,
    position: 0
  }
}

export function getPixelWidth (time, scale) {
  return (time / 1000) * DEFAULT_SECOND_WIDTH_PX * scale
}

export function getDisplayUnit (scale) {
  if (scale > 10) {
    return TIME_UNIT.frame
  }

  if (scale < 0.1) {
    return TIME_UNIT.minute
  }

  if (scale < 0.01) {
    return TIME_UNIT.hour
  }

  return TIME_UNIT.second
}

export function getMSDurationForUnit (unit, frameRate) {
  if (!UNIT_MS_DURATION[unit]) {
    return UNIT_MS_DURATION[TIME_UNIT.second]()
  }
  return UNIT_MS_DURATION[unit](frameRate)
}

function zeroPad (n) {
  if (n < 10) {
    return `0${n}`
  }
  return `${n}`
}

export function getSMPTETimecodeFromMs (ms, frameRate) {
  const hours = Math.floor(ms / UNIT_MS_DURATION.hour())
  const minutes = Math.floor((ms - hours * UNIT_MS_DURATION.hour()) / UNIT_MS_DURATION.minute())
  const seconds = Math.floor((ms - hours * UNIT_MS_DURATION.hour() - minutes * UNIT_MS_DURATION.minute()) / UNIT_MS_DURATION.second())
  const frames = Math.floor((ms - hours * UNIT_MS_DURATION.hour() - minutes * UNIT_MS_DURATION.minute() - seconds * UNIT_MS_DURATION.second()) / UNIT_MS_DURATION.frame(frameRate))

  return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}:${zeroPad(frames)}`
}

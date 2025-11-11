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

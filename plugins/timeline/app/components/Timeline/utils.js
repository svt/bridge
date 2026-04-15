import bridge from 'bridge'

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

export function getTimelineSpec (items = []) {
  const totalDuration = items.reduce((max, item) => {
    return Math.max(max, (item.data?.delay || 0) + bridge.items.getEffectiveDuration(item))
  }, 10000)

  return {
    frameRate: 50,
    duration: totalDuration,
    scale: 1,
    position: 0
  }
}

export function getPixelWidth (time, scale) {
  return (time / 1000) * DEFAULT_SECOND_WIDTH_PX * scale
}

export function pixelsToMs (pixels, scale) {
  return (pixels / DEFAULT_SECOND_WIDTH_PX / scale) * 1000
}

/**
 * Collect all start and end times from items, excluding
 * the item currently being dragged.
 */
export function getSnapPoints (items, excludeId) {
  const points = []
  for (const item of items) {
    if (item.id === excludeId) continue
    points.push(item.data?.delay || 0)
    points.push((item.data?.delay || 0) + bridge.items.getEffectiveDuration(item))
  }
  return points
}

/**
 * Round ms to the nearest frame boundary.
 */
export function quantizeToFrame (ms, frameRate) {
  if (!frameRate) return ms
  const frameDuration = 1000 / frameRate
  return Math.round(ms / frameDuration) * frameDuration
}

/**
 * Snap ms to the closest value in snapPoints if within thresholdMs,
 * otherwise return the frame-quantized value.
 */
export function snapMs (ms, snapPoints, thresholdMs, frameRate) {
  let best = null
  let bestDist = thresholdMs
  for (const point of snapPoints) {
    const dist = Math.abs(ms - point)
    if (dist < bestDist) {
      bestDist = dist
      best = point
    }
  }
  if (best !== null) return best
  return quantizeToFrame(ms, frameRate)
}

export function getDisplayUnitDurationMS (scale, frameRate) {
  const SCALE_BREAKPOINTS = [
    {
      scale: 50,
      duration: UNIT_MS_DURATION.frame(frameRate)
    },
    {
      scale: 25,
      duration: UNIT_MS_DURATION.frame(frameRate) * 2
    },
    {
      scale: 10,
      duration: UNIT_MS_DURATION.frame(frameRate) * 5
    },
    {
      scale: 5,
      duration: UNIT_MS_DURATION.frame(frameRate) * 10
    },
    {
      scale: 0.8,
      duration: UNIT_MS_DURATION.second()
    },
    {
      scale: 0.1,
      duration: UNIT_MS_DURATION.second() * 10
    },
    {
      scale: 0.01,
      duration: UNIT_MS_DURATION.minute()
    }
  ]

  if (scale < 0.01) {
    return (1 / scale) * UNIT_MS_DURATION.hour()
  }

  for (const breakpoint of SCALE_BREAKPOINTS) {
    if (scale > breakpoint.scale) {
      return breakpoint.duration
    }
  }

  return UNIT_MS_DURATION.second()
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

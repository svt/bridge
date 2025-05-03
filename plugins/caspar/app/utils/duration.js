const DEFAULT_DURATION_MS = 5000

/**
 * Calculate the duration in milliseconds from an item
 * based on its framerate and duration in frames
 * @param { any } item
 * @returns { Number }
 */
function calculateDurationMs (item) {
  if (!item) {
    return DEFAULT_DURATION_MS
  }
  // If the item is a still image, return 0
  if (item.type === 'STILL') {
    return 0
  }
  // If the item has no duration, return the default duration
  if (isNaN(Number(item?.duration))) {
    return DEFAULT_DURATION_MS
  }

  // If the item has no framerate, return the default duration
  if (!item?.framerate) {
    return DEFAULT_DURATION_MS
  }

  /**
   * Extract the framerate from the item - which is written as a fraction
   * @example
   * '1/25' -> 25
   * '1001/30000' -> 29.97
   */
  const framerate = frameRateFractionToDecimal(item?.framerate)
  if (!framerate) {
    return DEFAULT_DURATION_MS
  }

  return (Math.abs(item?.duration) / framerate) * 1000
}

/**
 * Calculate the decimal value of a fraction
 * @example
 * '30000/1001' -> 29.97
 * @param {any} fraction
 * @returns decimal value
 */
function frameRateFractionToDecimal (fraction) {
  const [divisorStr, dividendStr] = String(fraction).split('/')

  const divisor = parseInt(divisorStr)
  const dividend = parseInt(dividendStr)

  if (Number.isNaN(divisor) || Number.isNaN(dividend)) {
    return
  }

  if (divisor <= 0) {
    return
  }

  return dividend / divisor
}

export { calculateDurationMs }

/**
 * @typedef { 'STILL' | 'VIDEO' | 'AUDIO' | 'TEMPLATE' } LibraryAssetType
 *
 * @typedef {
 *  name: String,
 *  type: LibraryAssetType,
 *  size: String | undefined,
 *  timestamp: String | undefined,
 *  duration: String | undefined,
 *  framerate: String | undefined
 * } LibraryAsset
 */

export const DEFAULT_DURATION_MS = 5000
export const DEFAULT_FRAMERATE_FRACTION = '1/25'

const REX = /"(?<name>.+)"\s{2}(?<type>.+)\s(?<size>.+)\s(?<timestamp>.+)\s(?<duration>.+)\s(?<framerate>.+)/i

export const type = Object.freeze({
  still: 'STILL',
  video: 'VIDEO',
  audio: 'AUDIO',
  template: 'TEMPLATE'
})

export const typeConversion = Object.freeze({
  STILL: 'STILL',
  MOVIE: 'VIDEO',
  AUDIO: 'AUDIO',
  TEMPLATE: 'TEMPLATE'
})

/**
 * Parse a library asset string
 * returned from Caspar as an object
 * @param { String } str
 * @returns { LibraryAsset }
 */
export function parseMediaAsset (str) {
  const res = REX.exec(str)
  const rawType = (res?.groups?.type || '').replace(/\s/g, '')

  return {
    ...(res?.groups || {}),
    type: typeConversion[rawType]
  }
}

/**
 * Parse a library asset string
 * assuming it's a template
 * @param { String } str
 * @returns { LibraryAsset }
 */
export function parseTemplateAsset (str) {
  return {
    type: type.template,
    name: str
  }
}

/**
 * Calculate the duration in milliseconds from an item
 * based on its framerate and duration in frames
 * @param { any } item
 * @returns { Number }
 */
export function calculateDurationMs (item) {
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

  return Math.round((Math.abs(item?.duration) / framerate) * 1000)
}

/**
 * Calculate the decimal value of a fraction
 * @example
 * '30000/1001' -> 29.97
 * @param { string } fraction
 * @returns { number } decimal value
 */
export function frameRateFractionToDecimal (fraction) {
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

/**
 * Calculate the decimal value of a fraction, rounded to 3 decimal places
 * @example
 * '30000/1001' -> 29.97
 * '1/25' -> 25
 * @param { string } fraction
 * @returns { string } decimal value rounded to 3 decimal places
 */
export function frameRateFractionToDecimalRounded (fraction) {
  const decimal = frameRateFractionToDecimal(fraction)
  if (decimal === undefined) {
    return undefined
  }
  return decimal.toFixed(3)
}

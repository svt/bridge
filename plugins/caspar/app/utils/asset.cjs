/**
 * @typedef { 'STILL' | 'MOVIE' | 'AUDIO' | 'TEMPLATE' } LibraryAssetType
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

const DEFAULT_DURATION_MS = 5000

const REX = /"(?<name>.+)"\s{2}(?<type>.+)\s(?<size>.+)\s(?<timestamp>.+)\s(?<duration>.+)\s(?<framerate>.+)/i

const type = Object.freeze({
  still: 'STILL',
  movie: 'MOVIE',
  audio: 'AUDIO',
  template: 'TEMPLATE'
})
exports.type = type

/**
 * Parse a library asset string
 * returned from Caspar as an object
 * @param { String } str
 * @returns { LibraryAsset }
 */
function parseMediaAsset (str) {
  const res = REX.exec(str)
  return {
    ...(res?.groups || {}),
    type: (res?.groups?.type || '').replace(/\s/g, '')
  }
}
exports.parseMediaAsset = parseMediaAsset

/**
 * Parse a library asset string
 * assuming it's a template
 * @param { String } str
 * @returns { LibraryAsset }
 */
function parseTemplateAsset (str) {
  return {
    type: type.template,
    name: str
  }
}
exports.parseTemplateAsset = parseTemplateAsset

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

  if (item.type === 'STILL') {
    return 0
  }

  if (isNaN(Number(item?.duration))) {
    return DEFAULT_DURATION_MS
  }

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
exports.calculateDurationMs = calculateDurationMs

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
exports.frameRateFractionToDecimal = frameRateFractionToDecimal

/**
 * Build a string in hours:minutes:seconds format from milliseconds
 * @example
 * 1000 -> '00:01'
 * 61000 -> '01:01'
 * 3600000 -> '01:00:00'
 * @param {number} ms
 * @returns {string}
 */
function millisecondsToTime(ms) {
  if (ms < 0) return "00:00"
  if (!ms) return "00:00"
  if (isNaN(ms)) return "00:00"

  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n) => n.toString().padStart(2, "0")

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  } else {
    return `${pad(minutes)}:${pad(seconds)}`
  }
}
exports.millisecondsToTime = millisecondsToTime

/**
 * Frames to milliseconds
 * @param {number} frames
 * @param {number} framerate
 * @returns {number}
 */
function framesToMilliseconds(frames, framerate) {
  if (frames < 0) return 0
  if (!frames) return 0
  if (isNaN(frames)) return 0
  if (framerate <= 0) return 0
  if (!framerate) return 0
  if (isNaN(framerate)) return 0

  // Round to 1 decimal place
  return Math.round((frames / framerate) * 1000 * 10) / 10
}
exports.framesToMilliseconds = framesToMilliseconds

/**
 * Milliseconds to frames
 * @param {number} ms
 * @param {number} framerate
 * @returns {number}
 */
function millisecondsToFrames(ms, framerate) {
  if (ms < 0) return 0
  if (!ms) return 0
  if (isNaN(ms)) return 0
  if (framerate <= 0) return 0
  if (!framerate) return 0
  if (isNaN(framerate)) return 0

  return Math.round((ms / 1000) * framerate)
}
exports.millisecondsToFrames = millisecondsToFrames

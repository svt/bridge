// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  days: number,
 *  hours: number,
 *  minutes: number,
 *  seconds: number,
 *  frames: number,
 *  smpte: string
 * }} RawTimecodeFrame
 */

function zeroPad (n) {
  if (n < 10) return `0${n}`
  return `${n}`
}

class TimecodeFrame {
  /**
   * Complete a full frame from a partial one
   * such as returned by the LTC decoder
   *
   * All properties not existent in
   * the partial object will be zeroed
   *
   * @param { any } partial
   */
  static fromPartial (partial) {
    if (typeof partial !== 'object') {
      return undefined
    }

    const out = {
      days: parseInt(partial?.days || 0),
      hours: parseInt(partial?.hours || 0),
      minutes: parseInt(partial?.minutes || 0),
      seconds: parseInt(partial?.seconds || 0),
      frames: parseInt(partial?.frames || 0)
    }
    out.smpte = this.#makeSMPTEString(out.hours, out.minutes, out.seconds, out.frames)
    return out
  }

  /**
   * Create an SMPTE string
   * from separate values
   *
   * @param { number } hours
   * @param { number } minutes
   * @param { number } seconds
   * @param { number } frames
   * @returns { string }
   */
  static #makeSMPTEString (hours, minutes, seconds, frames) {
    return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}:${zeroPad(frames)}`
  }

  /**
   * Get a timecode frame
   * from an SMPTE string
   * @param { string } smpteString
   * @returns { RawTimecodeFrame? }
   */
  static fromSMPTE (smpteString) {
    if (typeof smpteString !== 'string') {
      return undefined
    }

    const components = smpteString
      // eslint-disable-next-line
      .split(/[:\.;]+/)
      .reverse()

    return {
      days: parseInt(components[4] || 0),
      hours: parseInt(components[3] || 0),
      minutes: parseInt(components[2] || 0),
      seconds: parseInt(components[1] || 0),
      frames: parseInt(components[0] || 0),
      smpte: smpteString
    }
  }

  /**
   * Compare two timecode frames,
   * will return true if they represent
   * the same point in time
   * @param { RawTimecodeFrame } frameA
   * @param { RawTimecodeFrame } frameB
   * @returns { boolean }
   */
  static compare (frameA, frameB) {
    if (typeof frameA !== 'object') {
      return false
    }

    if (typeof frameB !== 'object') {
      return false
    }

    return (
      frameA?.days === frameB?.days &&
      frameA?.hours === frameB?.hours &&
      frameA?.minutes === frameB?.minutes &&
      frameA?.seconds === frameB?.seconds &&
      frameA?.frames === frameB?.frames
    )
  }
}
module.exports = TimecodeFrame

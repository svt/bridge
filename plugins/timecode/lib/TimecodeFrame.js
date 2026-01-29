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

class TimecodeFrame {
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
      days: components[4] || 0,
      hours: components[3] || 0,
      minutes: components[2] || 0,
      seconds: components[1] || 0,
      frames: components[0] || 0,
      smpte: smpteString
    }
  }

  fromLTCFrame (ltcFrame) {

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

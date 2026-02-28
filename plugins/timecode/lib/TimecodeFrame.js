// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const TimecodeFrameValidationError = require('./error/TimecodeFrameValidationError')

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

const FRAME_VALIDATION_RULES = [
  {
    key: 'frames',
    type: 'number',
    min: 0,
    required: true
  },
  {
    key: 'seconds',
    type: 'number',
    min: 0,
    max: 59,
    required: true
  },
  {
    key: 'minutes',
    type: 'number',
    min: 0,
    max: 59,
    required: true
  },
  {
    key: 'hours',
    type: 'number',
    min: 0,
    max: 23,
    required: true
  },
  {
    key: 'days',
    type: 'number',
    min: 0,
    required: true
  },
  {
    key: 'smpte',
    type: 'string',
    fn: val => /^\d{2}:\d{2}:\d{2}:\d{2}$/.test(val),
    required: true
  }
]

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

  static toMs (frame, frameRate) {
    if (!this.validate(frame, frameRate)) {
      return false
    }

    if (typeof frameRate !== 'number') {
      return false
    }

    return (
      frame?.days * 86_400_000 +
      frame?.hours * 3_600_000 +
      frame?.minutes * 60_000 +
      frame?.seconds * 1000 +
      frame?.frames * (1000 / frameRate)
    )
  }

  /**
   * @throws
   * Validate a timecode
   * frame object
   *
   * Will throw a relevant error if
   * invalid or return true if valid
   *
   * @param { TimecodeFrame } frame
   * @param { number } frameRate
   * @returns { boolean }
   */
  static validate (frame, frameRate) {
    if (typeof frame !== 'object') {
      return false
    }

    if (typeof frameRate !== 'number') {
      return false
    }

    for (const rule of FRAME_VALIDATION_RULES) {
      if (rule.required && !Object.prototype.hasOwnProperty.call(frame, rule.key)) {
        throw new TimecodeFrameValidationError(`Missing required key "${rule.key}"`)
      }

      if (rule.type) {
        // eslint-disable-next-line
        if (typeof frame[rule.key] !== rule.type) {
          throw new TimecodeFrameValidationError(`Expected key "${rule.key}" to have a value of type ${rule.type}`)
        }
      }

      if (rule.min != null) {
        if (frame[rule.key] < rule.min) {
          throw new TimecodeFrameValidationError(`Value for key "${rule.key}" must be greater than ${rule.min}`)
        }
      }

      if (rule.max != null) {
        if (frame[rule.key] > rule.max) {
          throw new TimecodeFrameValidationError(`Value for key "${rule.key}" must be less than ${rule.max}`)
        }
      }

      if (rule.fn != null) {
        if (!rule.fn(frame[rule.key])) {
          throw new TimecodeFrameValidationError(`Value for key "${rule.key}" failed custom validation rule`)
        }
      }
    }

    /*
    Invalid frame number
    */
    if (frame.frames >= frameRate) {
      throw new TimecodeFrameValidationError('Frame value cannot be greater than or equal to the frame rate')
    }

    return true
  }

  static next (frame, frameRate) {
    if (!this.validate(frame, frameRate)) {
      return false
    }

    if (typeof frameRate !== 'number') {
      return false
    }

    const out = {}
    out.frames = ((frame.frames + 1) % frameRate)
    out.seconds = (frame.seconds + (out.frames < frame.frames ? 1 : 0)) % 60
    out.minutes = (frame.minutes + (out.seconds < frame.seconds ? 1 : 0)) % 60
    out.hours = (frame.hours + (out.minutes < frame.minutes ? 1 : 0)) % 24
    out.days = frame.days + (out.hours < frame.hours ? 1 : 0)
    out.smpte = this.#makeSMPTEString(out.hours, out.minutes, out.seconds, out.frames)

    return out
  }
}
module.exports = TimecodeFrame

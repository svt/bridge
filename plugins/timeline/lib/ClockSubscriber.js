// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../../api').Api }
 */
const bridge = require('bridge')

const DIController = require('./DIController')
const DIBase = require('../../../shared/DIBase')

/**
 * Frame rates supported by the timecode plugin's LTC decoder
 * Must stay in sync with LTCDecoder.SUPPORTED_FRAME_RATES
 * @type { number[] }
 */
const LTC_SUPPORTED_FRAME_RATES = [24, 25, 30]

const TIMECODE_PLUGIN_NAME = 'bridge-plugin-timecode'
const TIMELINE_TYPE = 'bridge.types.timeline'

/**
 * Convert a SMPTE string (HH:MM:SS:FF) to milliseconds
 *
 * @param { string } smpte
 * @param { number } frameRate
 * @returns { number }
 */
function smpteToMs (smpte, frameRate) {
  const [hh, mm, ss, ff] = smpte.split(':').map(Number)
  return (
    hh * 3_600_000 +
    mm * 60_000 +
    ss * 1_000 +
    ff * (1000 / frameRate)
  )
}

/**
 * Look up the clock id registered by the timecode plugin
 * for a given LTC device input id.
 *
 * @param { string } inputId
 * @returns { string | undefined }
 */
function getClockIdForInput (inputId) {
  const state = bridge.state.getLocalState()
  return state?.plugins?.[TIMECODE_PLUGIN_NAME]?.clocks?.[inputId]
}

/**
 * Get the frame rate for a given LTC device input id
 * by reading the device spec from state
 *
 * @param { string } inputId
 * @returns { number }
 */
function getFrameRateForInput (inputId) {
  const state = bridge.state.getLocalState()
  const devices = state?.plugins?.[TIMECODE_PLUGIN_NAME]?.settings?.ltc_devices || []
  const device = devices.find(d => d.id === inputId)
  return LTC_SUPPORTED_FRAME_RATES[device?.frameRateIndex ?? 1] ?? 25
}

/**
 * Manages time.frame subscriptions for TC-latched timelines
 *
 * Each latched timeline has exactly one active subscription
 * Calling latch() on an already-latched timeline first
 * unlatches it to avoid duplicate handlers
 */
class ClockSubscriber extends DIBase {
  /**
   * props: { SequencerRegistry }
   */

  /*
   * Map<timelineId, { clockId: string, handler: Function }>
   */
  #subscriptions = new Map()

  /**
   * Subscribe a timeline to a TC clock
   * Replaces any existing subscription for this timeline
   *
   * @param { string } timelineId
   * @param { string } clockId
   * @param { number } startTimeMs  Timeline position that maps to TC t=0.
   * @param { number } frameRate    Frame rate of the clock source.
   */
  latch (timelineId, clockId, startTimeMs, frameRate) {
    this.unlatch(timelineId)

    const sequencer = this.props.SequencerRegistry.getOrCreate(timelineId)

    const handler = async frame => {
      const positionMs = smpteToMs(frame.smpte, frameRate) - startTimeMs

      /*
      Ignore frames that fall before the start time —
      the timeline hasn't started from TC's perspective yet
      */
      if (positionMs < 0) return

      const state = bridge.state.getLocalState()
      const timeline = state?.items?.[timelineId]
      if (!timeline) return

      const children = (timeline.children || [])
        .map(id => state.items?.[id])
        .filter(Boolean)

      await sequencer.advance(positionMs, children)
    }

    this.#subscriptions.set(timelineId, { clockId, handler })
    bridge.events.on(`time.frame.${clockId}`, handler)
  }

  /**
   * Unsubscribe a timeline from its clock and
   * remove its sequencer
   *
   * @param { string } timelineId
   */
  unlatch (timelineId) {
    const sub = this.#subscriptions.get(timelineId)
    if (!sub) return

    bridge.events.off(`time.frame.${sub.clockId}`, sub.handler)
    this.#subscriptions.delete(timelineId)
    this.props.SequencerRegistry.remove(timelineId)
  }

  /**
   * Idempotent reconciliation for a single timeline
   *
   * Reads the timeline's current timecode.input and
   * timecode.startTime from state and either latches,
   * re-latches, or unlatches accordingly
   *
   * @param { string } timelineId
   */
  reconcile (timelineId) {
    const state = bridge.state.getLocalState()
    const timeline = state?.items?.[timelineId]
    if (!timeline || timeline.type !== TIMELINE_TYPE) return

    const inputId = timeline.data?.['timecode.input']
    if (!inputId) {
      this.unlatch(timelineId)
      return
    }

    const clockId = getClockIdForInput(inputId)
    if (!clockId) {
      this.unlatch(timelineId)
      return
    }

    const frameRate = getFrameRateForInput(inputId)
    const startSmpte = timeline.data?.['timecode.startTime'] || '00:00:00:00'
    const startTimeMs = smpteToMs(startSmpte, frameRate)

    this.latch(timelineId, clockId, startTimeMs, frameRate)
  }
}

DIController.register('ClockSubscriber', ClockSubscriber, ['SequencerRegistry'])

module.exports = ClockSubscriber

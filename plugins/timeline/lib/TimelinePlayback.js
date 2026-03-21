// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../../api').Api }
 */
const bridge = require('bridge')

const DIController = require('./DIController')
const DIBase = require('../../../shared/DIBase')

const TIMELINE_TYPE = 'bridge.types.timeline'
const TIMECODE_PLUGIN_NAME = 'bridge-plugin-timecode'

/**
 * Top-level orchestrator for timeline playback.
 *
 * Listens for item.play, item.stop and state.change
 * events and delegates to ClockSubscriber (for TC-latched
 * timelines) or drives free playback directly.
 */
class TimelinePlayback extends DIBase {
  /**
   * props: { SequencerRegistry, ClockSubscriber }
   */

  /**
   * Wire up all event listeners.
   * Call once from exports.activate.
   */
  activate () {
    bridge.events.on('item.play', item => {
      if (item.type === TIMELINE_TYPE) this.#onPlay(item)
    })

    bridge.events.on('item.stop', item => {
      if (item.type === TIMELINE_TYPE) this.#onStop(item)
    })

    bridge.events.on('state.change', (state, set) => {
      this.#onStateChange(state, set)
    })

    /*
    Reconcile all existing timeline items on startup
    in case the workspace is loaded with TC inputs already set
    */
    this.#reconcileAll()
  }

  /**
   * Handle item.play for a timeline.
   *
   * If the timeline has a TC input configured, the clock
   * subscription drives playback — we only need to play
   * the timeline item itself (which SItems already did).
   *
   * Without a TC input, schedule each child using its
   * own data.delay so they fire at the right wall-clock times.
   *
   * @param { any } item  The timeline item as passed by item.play
   */
  async #onPlay (item) {
    const state = bridge.state.getLocalState()
    const timeline = state?.items?.[item.id]

    if (timeline?.data?.['timecode.input']) {
      /*
      TC-latched: clock frames drive child playback,
      nothing more to do here
      */
      return
    }

    /*
    Free play: fire each child respecting its own delay.
    Await each call so all play commands are sent to the
    server before any concurrent stop can overtake them.
    */
    const children = timeline?.children || []
    for (const childId of children) {
      await bridge.items.playItem(childId)
    }
  }

  /**
   * Handle item.stop for a timeline.
   *
   * Stops all children, tearing down the TC sequencer
   * if one is active.
   *
   * @param { any } item
   */
  async #onStop (item) {
    const state = bridge.state.getLocalState()
    const timeline = state?.items?.[item.id]
    const children = (timeline?.children || [])
      .map(id => state?.items?.[id])
      .filter(Boolean)

    if (this.props.SequencerRegistry.has(item.id)) {
      const sequencer = this.props.SequencerRegistry.getOrCreate(item.id)
      await sequencer.stop(children)
      this.props.ClockSubscriber.unlatch(item.id)
    } else {
      /*
      Bypass bridge.items.stopItem(id) which does 3 async round-trips
      (getItem + getType + getVariables) before sending the command.
      We already have the full item objects from state, so call the
      server command directly to guarantee stop arrives before any
      subsequent in-flight play commands.
      */
      for (const child of children) {
        bridge.commands.executeCommand('items.stopItem', child)
      }
    }
  }

  /**
   * Reconcile clock subscriptions whenever the state changes.
   *
   * Reacts to:
   * - A timeline's timecode.input or timecode.startTime changing
   * - Timecode clocks being registered or removed
   *
   * @param { any } state  Full new state
   * @param { any } set    The set (delta) that was applied
   */
  #onStateChange (state, set) {
    /*
    A timeline item's TC settings changed — reconcile just that item
    */
    if (set?.items) {
      for (const [id, change] of Object.entries(set.items)) {
        if (
          change?.data?.['timecode.input'] !== undefined ||
          change?.data?.['timecode.startTime'] !== undefined
        ) {
          this.props.ClockSubscriber.reconcile(id)
        }
      }
    }

    /*
    The timecode plugin's clock registry changed
    (e.g. LTC device connected or disconnected).
    Reconcile all timeline items that have a TC input set.
    */
    if (set?.plugins?.[TIMECODE_PLUGIN_NAME]?.clocks) {
      const items = Object.values(state?.items || {})
      for (const item of items) {
        if (item.type === TIMELINE_TYPE && item.data?.['timecode.input']) {
          this.props.ClockSubscriber.reconcile(item.id)
        }
      }
    }
  }

  /**
   * Reconcile all timeline items in the current state.
   * Used on startup to restore subscriptions from a saved workspace.
   */
  #reconcileAll () {
    const state = bridge.state.getLocalState()
    const items = Object.values(state?.items || {})
    for (const item of items) {
      if (item.type === TIMELINE_TYPE) {
        this.props.ClockSubscriber.reconcile(item.id)
      }
    }
  }
}

DIController.register('TimelinePlayback', TimelinePlayback, ['SequencerRegistry', 'ClockSubscriber'])

module.exports = TimelinePlayback

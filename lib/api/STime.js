// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const uuid = require('uuid')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

/**
 * @typedef {{
 *  hours: number?,
 *  minutes: number?,
 *  seconds: number?,
 *  frames: number?,
 *  milliseconds: number?
 * }} ClockFrame
 */

const MAIN_CLOCK_INTERVAL_MS = 1000

class STime extends DIBase {
  #mainClockIval

  constructor (...args) {
    super(...args)
    this.#setup()
  }

  /**
   * @param { Date } date
   * @returns { ClockFrame }
   */
  #frameFromDate (date) {
    return {
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds()
    }
  }

  #setupMainClock () {
    const id = this.registerClock({
      id: 'main',
      label: 'Wall clock'
    })
    this.#mainClockIval = setInterval(() => {
      this.submitFrame(id, this.#frameFromDate(new Date()))
    }, MAIN_CLOCK_INTERVAL_MS)
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('time.getServerTime', this.getServerTime.bind(this))
    this.props.SCommands.registerAsyncCommand('time.registerClock', this.registerClock.bind(this))
    this.props.SCommands.registerAsyncCommand('time.getAllClocks', this.getAllClocks.bind(this))
    this.props.SCommands.registerAsyncCommand('time.removeClock', this.removeClock.bind(this))
    this.props.SCommands.registerAsyncCommand('time.applyClock', this.applyClock.bind(this))
    this.props.SCommands.registerCommand('time.submitFrame', this.submitFrame.bind(this))

    this.#setupMainClock()
  }

  #getClockId () {
    return uuid.v4()
  }

  async #emitClocksChangedEvent () {
    const clocks = await this.getAllClocks()
    this.props.SEvents.emit('time.clocks.change', clocks)
  }

  async getAllClocks () {
    const clocksObj = await this.props.SState.getState('clocks')
    if (!clocksObj) {
      return []
    }
    return Object.entries(clocksObj)
      .map(([id, spec]) => {
        return {
          ...spec,
          id
        }
      })
  }

  registerClock (spec) {
    const id = spec?.id || this.#getClockId()
    const set = {
      clocks: {
        [id]: {
          label: spec?.label || ''
        }
      }
    }

    this.props.SState.applyState(set)
    this.#emitClocksChangedEvent()
    return id
  }

  removeClock (clockId) {
    if (typeof clockId !== 'string') {
      return
    }

    const clockExists = this.props.SState.getState(`clocks.${clockId}`)
    if (!clockExists) {
      return
    }

    this.props.SState.applyState({
      clocks: {
        [clockId]: { $delete: true }
      }
    })

    this.#emitClocksChangedEvent()
    return true
  }

  applyClock (clockId, set) {
    this.props.SState.applyState({
      clocks: {
        [clockId]: set
      }
    })
    this.#emitClocksChangedEvent()
  }

  /**
   * Get the current
   * server time
   *
   * @returns {
   *  now: number
   * }
   */
  getServerTime () {
    return Date.now()
  }

  /**
   * Submit a clock frame
   * for a specific clock
   * @param { string } clockId
   * @param { ClockFrame } frame
   */
  submitFrame (clockId, frame) {
    this.props.SEvents.emit('time.frame', clockId, frame)
    this.props.SEvents.emit(`time.frame.${clockId}`, frame)
  }
}

DIController.main.register('STime', STime, [
  'SCommands',
  'SEvents',
  'SState'
])

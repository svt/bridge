// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const uuid = require('uuid')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class STime extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('time.registerClock', this.registerClock.bind(this))
    this.props.SCommands.registerAsyncCommand('time.getAllClocks', this.getAllClocks.bind(this))
    this.props.SCommands.registerAsyncCommand('time.removeClock', this.removeClock.bind(this))
    this.props.SCommands.registerAsyncCommand('time.applyClock', this.applyClock.bind(this))
    this.props.SCommands.registerAsyncCommand('time.tickClock', this.tickClock.bind(this))
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
    const id = this.#getClockId()
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

  removeClock (id) {
    if (typeof id !== 'string') {
      return
    }

    const clockExists = this.props.SState.getState(`clocks.${id}`)
    if (!clockExists) {
      return
    }

    this.props.SState.applyState({
      clocks: {
        [id]: { $delete: true }
      }
    })

    this.#emitClocksChangedEvent()
    return true
  }

  applyClock (id, set) {
    this.props.SState.applyState({
      clocks: {
        [id]: set
      }
    })
    this.#emitClocksChangedEvent()
  }

  tickClock (id, values) {
    /**
     * @todo
     * Implement tick clock logic to validate
     * values and emit the time.tick event
     */
  }
}

DIController.main.register('STime', STime, [
  'SCommands',
  'SEvents',
  'SState'
])

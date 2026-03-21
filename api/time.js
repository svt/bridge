// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../shared/DIController')

const SERVER_TIME_TTL_MS = 10000

class Time {
  #props

  #serverTime
  #serverTimeUpdatedAt
  #serverTimePromise

  constructor (props) {
    this.#props = props
  }

  getAllClocks () {
    return this.#props.Commands.executeCommand('time.getAllClocks')
  }

  registerClock (spec) {
    return this.#props.Commands.executeCommand('time.registerClock', spec)
  }

  removeClock (id) {
    return this.#props.Commands.executeCommand('time.removeClock', id)
  }

  applyClock (id, set) {
    return this.#props.Commands.executeCommand('time.applyClock', id, set)
  }

  submitFrame (id, frame) {
    return this.#props.Commands.executeRawCommand('time.submitFrame', id, frame)
  }

  /**
   * Update the record of
   * the current server time
   *
   * This will set the #serverTime and #serverTimeUpdatedAt
   * properties, allowing the client to return the correct time
   * accordingly
   *
   * @returns { Promise.<void> }
   */
  async #updateServerTime () {
    /*
    Skip updating if it's already trying
    to update to avoid multiple requests
    */
    if (this.#serverTimePromise) {
      return this.#serverTimePromise
    }

    /*
    Resolve immediately if the local
    time hasn't become outdated
    */
    if (this.#serverTimeUpdatedAt && (Date.now() - this.#serverTimeUpdatedAt) < SERVER_TIME_TTL_MS) {
      return Promise.resolve()
    }

    this.#serverTimePromise = new Promise((resolve, reject) => {
      const start = Date.now()
      this.#props.Commands.executeCommand('time.getServerTime')
        .then(now => {
          const roundtripDur = Date.now() - start
          this.#serverTime = now + Math.round(roundtripDur / 2)
          this.#serverTimeUpdatedAt = Date.now()
          resolve()
        })
        .catch(err => {
          this.#serverTimeUpdatedAt = Date.now()
          reject(err)
        })
        .finally(() => {
          this.#serverTimePromise = undefined
        })
    })
    return this.#serverTimePromise
  }

  /**
   * Get the current time according to the server,
   * compensating for latency and clock drift
   * @returns { Promise.<number> }
   */
  async now (id) {
    await this.#updateServerTime()
    return this.#serverTime + (Date.now() - this.#serverTimeUpdatedAt)
  }
}

DIController.main.register('Time', Time, [
  'Commands'
])

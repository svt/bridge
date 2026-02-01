// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../shared/DIController')

class Time {
  #props

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
}

DIController.main.register('Time', Time, [
  'State',
  'Events',
  'Commands'
])

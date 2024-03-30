// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')
const Interval = require('./lib/Interval')

/**
 * Define the main interval in milliseconds
 * with which events will be checked
 */
const MAIN_INTERVAL_MS = 10

/**
 * A map keeping references to
 * all currently running timers
 * @type { Map.<String, any> }
 */
const events = new Map()

/*
Setup the main interval
for checking events
*/
const interval = new Interval(MAIN_INTERVAL_MS, now => {
  for (const event of events) {
    if (event[1].triggersAt > now) {
      continue
    }
    events.delete(event[0])
    event[1].fn()
  }
})

interval.start()

exports.activate = async () => {
  /**
   * Delay the execution of a command
   * a certain amount of milliseconds
   */
  bridge.commands.registerCommand('scheduler.delay', (id, ms, command, ...args) => {
    abortEvent(id)

    const now = Date.now()
    const event = {
      start: now,
      delay: ms,
      triggersAt: now + ms,
      fn: () => {
        bridge.commands.executeCommand(command, ...args)
      }
    }

    events.set(id, event)
  })

  /**
   * Abort a timer by its id
   */
  function abortEvent (id) {
    const event = events.get(id)
    if (!event) {
      return
    }
    events.delete(id)
  }

  bridge.commands.registerCommand('scheduler.abort', id => {
    abortEvent(id)
  })
}

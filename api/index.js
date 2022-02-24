// SPDX-FileCopyrightText: 2022 Sveriges Television AB
// © 2022
//
// SPDX-License-Identifier: MIT

const transport = require('./transport')
const commands = require('./commands')
const widgets = require('./widgets')
const events = require('./events')
const server = require('./server')
const state = require('./state')
const types = require('./types')

/**
 * The api entrypoint
 * exposed to plugins
 * @type { Api }
 */
const api = {
  transport,
  commands,
  widgets,
  events,
  server,
  state,
  types
}

module.exports = api

/*
Expose the api as window.bridge
if we're running in a browser
*/
if (typeof window !== 'undefined') {
  window.bridge = api
}

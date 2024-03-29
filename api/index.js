// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const transport = require('./transport')
const variables = require('./variables')
const shortcuts = require('./shortcuts')
const commands = require('./commands')
const settings = require('./settings')
const widgets = require('./widgets')
const client = require('./client')
const events = require('./events')
const server = require('./server')
const state = require('./state')
const types = require('./types')
const items = require('./items')

/**
 * The api entrypoint
 * exposed to plugins
 * @type { Api }
 */
const api = {
  transport,
  variables,
  shortcuts,
  commands,
  settings,
  widgets,
  client,
  events,
  server,
  state,
  types,
  items
}

module.exports = api

/*
Expose the api as window.bridge
if we're running in a browser
*/
if (typeof window !== 'undefined') {
  window.bridge = api
}

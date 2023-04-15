// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const state = require('./state')

/**
 * Make a widget available
 * to the application
 * @param {
 *   id: String,
 *   name: String,
 *   uri: String,
 *   description: String
 * } spec
 */
function registerWidget (spec) {
  state.apply({
    _widgets: {
      [spec.id]: spec
    }
  })
}
exports.registerWidget = registerWidget

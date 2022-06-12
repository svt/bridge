// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const State = require('./State')

/**
 * A state representing user defaults,
 * that is settings for the current local
 * machine that is shared between workspaces
 * @type { State }
 */
module.exports = new State()

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const platform = require('./lib/platform')

/*
Do required initialization
*/
require('./lib/init-common')
require('./lib/server')

if (platform.isElectron()) {
  require('./lib/init-electron')
} else {
  require('./lib/init-node')
}

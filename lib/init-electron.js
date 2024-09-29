// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs')
const electron = require('./electron')

const paths = require('./paths')
const UserDefaults = require('./UserDefaults')

const Logger = require('./Logger')
const logger = new Logger({ name: 'init-electron' })

/*
Setup a new window if running
in an electron context
*/
;(async function () {
  await electron.isReady()

  if (electron.wasOpenedByFile()) {
    return
  }

  electron.initWindow(`http://localhost:${UserDefaults.data.httpPort}`)
})()

/*
Write the user defaults-state to disk
before the process exits
*/
function writeUserDeafults () {
  logger.debug('Writing user defaults to disk')
  fs.writeFileSync(paths.userDefaults, JSON.stringify(UserDefaults.data))
}

electron.app.once('will-quit', () => {
  writeUserDeafults()
})

// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs')
const electrobun = require('./electrobun/electrobun')

const paths = require('./paths')
const UserDefaults = require('./UserDefaults')

const Logger = require('./Logger')
const logger = new Logger({ name: 'init-electrobun' })

/*
Set up a workspace window unless the app was opened by a file
(in which case lib/electrobun/electrobun.js's open-url handler
or the Windows argv handler will spawn the window).
*/
;(async function () {
  await electrobun.isReady()

  if (electrobun.wasOpenedByFile()) {
    logger.debug('Opened by file, skipping initial workspace setup')
    return
  }

  logger.debug('Setting up initial workspace')
  await electrobun.initNewWorkspaceWindow()
})()

/*
Persist UserDefaults before the process exits.
*/
function writeUserDefaults () {
  logger.debug('Writing user defaults to disk')
  fs.writeFileSync(paths.userDefaults, JSON.stringify(UserDefaults.data))
}

electrobun.app.on('before-quit', () => {
  logger.debug('App will quit, performing cleanup tasks')
  writeUserDefaults()
})

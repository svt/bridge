// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs')

const paths = require('./paths')
const UserDefaults = require('./UserDefaults')

const Logger = require('./Logger')
const logger = new Logger({ name: 'init-node' })

/*
Write the user defaults-state to disk
before the process exits
*/
function writeUserDeafults () {
  logger.debug('Writing user defaults to disk')
  fs.writeFileSync(paths.userDefaults, JSON.stringify(UserDefaults.data))
}

process.on('exit', () => writeUserDeafults())

process.on('SIGTERM', () => {
  writeUserDeafults()
  process.exit(0)
})

process.on('SIGINT', () => {
  writeUserDeafults()
  process.exit(0)
})

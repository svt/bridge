// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')

const utils = require('./utils')
const paths = require('./paths')
const config = require('./config')

const Logger = require('./Logger')
const logger = new Logger({ name: 'init-common' })

const UserDefaults = require('./UserDefaults')

const DEFAULT_HTTP_PORT = config.defaults.HTTP_PORT

/**
 * Verify that an assets file is
 * created before running the app,
 * hashes are used in order to eliminate
 * caching issues
 */
;(function () {
  const assetsExist = fs.existsSync(path.join(__dirname, '../assets.json'))
  assert(
    assetsExist,
    'No assets file found, the project must be built before it\'s run: \'npm build\''
  )
})()

/**
 * Create the plugin directories
 * if they don't already exist
 */
;(function () {
  logger.debug('Creating plugin directory')
  utils.createDirectoryRecursively(paths.plugins)
})()

/**
 * Remove and recreate the temporary directory
 * in order to make sure that it's cleared and
 * exists
 */
;(function () {
  logger.debug('Recreating temporary directory')
  try {
    fs.rmSync(paths.temp, { force: true, recursive: true })
  } catch (err) {
    logger.warn('Failed to remove temporary files directory', err)
  }
  utils.createDirectoryRecursively(paths.temp)
})()

/**
 * Restore user defaults into
 * the user defaults-state
 */
;(async function () {
  logger.debug('Restoring user deafults', paths.userDefaults)
  let json
  try {
    const data = fs.readFileSync(paths.userDefaults, { encoding: 'utf8' })
    json = JSON.parse(data || '{}')

    UserDefaults.apply({
      ...json
    })
  } catch (err) {
    logger.warn('Failed to restore user defaults, maybe it\'s the first time the application is running', err)
  } finally {
    UserDefaults.apply({
      httpPort: process.env.PORT || json?.httpPort || DEFAULT_HTTP_PORT
    })
  }
})()

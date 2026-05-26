// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')

const platform = require('./platform')

/**
 * Resolve the per-user application data directory.
 * - Electrobun:  Electrobun.Utils.paths.userData (preloaded in
 *                lib/electrobun-runtime/index.ts and stashed on
 *                globalThis to avoid the ESM/CJS async-module barrier)
 * - Headless:    relative to APP_DATA_BASE_PATH env var
 */
function resolveAppDataDir () {
  if (platform.isElectrobun()) {
    return globalThis.__ELECTROBUN__.Utils.paths.userData
  }
  assert(
    process.env.APP_DATA_BASE_PATH,
    'Missing required env variable APP_DATA_BASE_PATH since we\'re not running in Electrobun'
  )
  return path.join(__dirname, process.env.APP_DATA_BASE_PATH)
}

/**
 * The base path for application data: plugins, settings, etc.
 * @type { String }
 */
const appData = resolveAppDataDir()
exports.appData = appData

/**
 * The base path for plugins
 * @type { String }
 */
const plugins = path.join(appData, '/plugins')
exports.plugins = plugins

/**
 * The base path for
 * internal plugins
 * @type { String }
 */
const internalPlugins = path.join(__dirname, '../plugins')
exports.internalPlugins = internalPlugins

/**
 * The base path for temporary files
 * that will be removed when the
 * application cleans its state
 * @type { String }
 */
const temp = path.join(appData, '/temp')
exports.temp = temp

/**
 * The user defaults file for storing
 * user specific settings
 * @type { String }
 */
const userDefaults = path.join(appData, '/UserDefaults.json')
exports.userDefaults = userDefaults

/**
 * Check whether or not
 * a path is a file
 * @param { string } filePath
 * @returns { boolean }
 */
async function pathIsFile (filePath) {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.isFile()
  } catch {
    return false
  }
}
exports.pathIsFile = pathIsFile

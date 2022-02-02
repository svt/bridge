/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * A static declaration of paths
 * used for different parts of the app
 */

const path = require('path')
const assert = require('assert')
const electron = require('./electron')

;(function () {
  assert(
    electron.isCompatible() || process.env.APP_DATA_BASE_PATH,
    'Missing required env variable APP_DATA_BASE_PATH since we\'re not running in Electron'
  )
})()

/**
 * The base path for
 * application data,
 *
 * this includes but is
 * not limited to plugins
 * and settings
 *
 * @type { String }
 */
const appData = process.env.APP_DATA_BASE_PATH
  ? path.join(__dirname, process.env.APP_DATA_BASE_PATH)
  : electron.app.getPath('userData')

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
 * The base path for
 * workspace templates
 * @type { String }
 */
const templates = path.join(__dirname, '../templates')
exports.templates = templates

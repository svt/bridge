/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  serveFile: (String) => Void
 * }} WidgetsApi
 */

const path = require('path')

const ApiError = require('../error/ApiError')

const Logger = require('../Logger')
const logger = new Logger({ name: 'WidgetApi' })

const StaticFileRegistry = require('../StaticFileRegistry')

/**
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * Serve a file through
   * the http-server
   * @param { import('fs').PathLike } filepath An absolute path to the file
   * @returns { String } An id representing the served file
   */
  function serveFile (filepath) {
    logger.debug('Serving file', filepath)
    if (!path.isAbsolute(filepath)) {
      throw new ApiError('The path to a file to serve must be absolute', 'ERR_API_WIDGETS_NO_ABSOLUTE_PATH')
    }
    return StaticFileRegistry.getInstance().serve(filepath)
  }
  api.registerAsyncCommand('widgets.serveFile', serveFile)
}
exports.factory = factory

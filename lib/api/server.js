// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const ApiError = require('../error/ApiError')

const paths = require('../paths')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Server api' })

const StaticFileRegistry = require('../StaticFileRegistry')

/**
 * Hash a string using SHA256
 * and digest it as hex
 * @param { String } str
 * @returns { String }
 */
function sha256Hash (str) {
  const hash = crypto.createHash('sha256')
  return hash.update(str).digest('hex')
}

/**
 * Serve a file through
 * the http-server
 * @param { import('fs').PathLike } filepath An absolute path to the file
 * @returns { String } An id representing the served file,
 *                     this can be used to construct a url
 *                     for requesting the file
 */
function serveFile (filepath) {
  logger.debug('Serving file', filepath)
  if (!path.isAbsolute(filepath)) {
    throw new ApiError('The path to a file to serve must be absolute', 'ERR_API_WIDGETS_NO_ABSOLUTE_PATH')
  }
  return StaticFileRegistry.getInstance().serve(filepath)
}

/**
 * Serve a string through
 * the web server
 * @param { String } str A string to serve
 * @returns { String } An id representing the served file,
 *                     this can be used to construct a url
 *                     for requesting the file
 */
async function serveString (str) {
  logger.debug('Serving string as file')
  /*
  Let the hash be the filename
  in order to avoid duplicates
  */
  const hash = sha256Hash(str)
  const filepath = path.join(paths.temp, hash)

  await fs.promises.writeFile(filepath, str)
  return serveFile(filepath)
}

/**
 * Stop serving a file through
 * the web server by its id
 *
 * Temporary files will
 * not be removed
 *
 * @param { String } id The identifier of the file to remove,
 *                      this is retrieved from serveFile or serveString
 * @returns { Boolean }
 */
async function unserve (id) {
  logger.debug('Unserving a file')
  return StaticFileRegistry.getInstance().remove(id)
}

/**
 * A factory function
 * for the server API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api) {
  api.commands.registerAsyncCommand('server.unserve', unserve)
  api.commands.registerAsyncCommand('server.serveFile', serveFile)
  api.commands.registerAsyncCommand('server.serveString', serveString)
}
exports.factory = factory

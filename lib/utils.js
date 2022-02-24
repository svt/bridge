// Copyright © 2021 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const stream = require('stream')
const fetch = require('node-fetch')

/**
 * An express middleware for making
 * is easier to work with promises
 *
 * The provided function parameter
 * will receive the req and res objects
 * as parameters and is required
 * to return a Promise.
 *
 * The value the Promise resolves
 * to will be written to the response
 * and any thrown error will be forwarded
 * to Express' next function.
 *
 * @param { Function.<Promise<Any>> } fn A function handling the request,
 *                                       must return a promise
 * @returns { Function } An express middleware function
 */
function promiseMiddleware (fn) {
  return async function (req, res, next) {
    try {
      const response = await fn(req, res)

      if (response?.body != null && response?.body instanceof stream.Readable) {
        response.body.pipe(res)
        return
      }

      res.send(response)
    } catch (e) {
      next(e)
    }
  }
}
exports.promiseMiddleware = promiseMiddleware

/**
 * Strip the trailing slash from
 * a string if it has one
 * @param { String } str
 * @returns { String }
 */
function stripTrailingSlash (str) {
  if (str[str.length - 1] !== '/') return str
  return str.substr(0, str.length - 1)
}
exports.stripTrailingSlash = stripTrailingSlash

/**
 * A convenience function for
 * making a GET request and reading
 * the response as json
 * @param { String } url A url to a resource to request
 * @returns { Promise.<Object> }
 */
function fetchJson (url) {
  return fetch(url)
    .then(res => res.json())
}
exports.fetchJson = fetchJson

/**
 * A wrapper for creating
 * a directory recursively
 * @param { String } path A path to create
 * @returns { Promise.<void> }
 */
function createDirectoryRecursively (path) {
  return fs.promises.mkdir(path, { recursive: true })
}
exports.createDirectoryRecursively = createDirectoryRecursively

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Module = require('module')
const { workerData } = require('worker_threads')

const WorkerError = require('../error/WorkerError')
const api = require('../../api')

/*
Shim require to return the api
whenever it's requesting 'bridge'

If using webpack or other bundlers
to bundle code this means that
bridge should be marked as an external
commonjs module.
*/
;(function () {
  const _require = Module.prototype.require

  Module.prototype.require = function (path) {
    if (path === 'bridge') {
      return api
    }
    return _require.call(this, path)
  }
})()

/*
Require the plugin and call
its initializer function
*/
;(function () {
  const plugin = require(workerData?.manifest?._path)

  if (!Object.prototype.hasOwnProperty.call(plugin, 'activate') && typeof plugin.activate !== 'function') {
    throw new WorkerError('Main script is missing the required activate function')
  }
  plugin.activate()
})()

/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 * @description This script loads a plugin in a worker thread
 *              and makes the bridge api available for use
 */

const Module = require('module')

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
      return _require.call(this, '../../api')
    }
    return _require.call(this, path)
  }
})()

const test = require('./test')
test.init()

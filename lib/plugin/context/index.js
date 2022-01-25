/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  bundle: String
 * }} PluginManifest
 *
 * @typedef {{
 *  version: String,
 *  manifest: PluginManifest,
 *  state: State,
 *  apply: (Object) => Void
 * }} PluginContext
 */

const path = require('path')
const { Worker } = require('worker_threads')
const State = require('../../State')

/**
 * The path to the script which will
 * bootstrap the plugin in the worker
 * thread
 *
 * Must be relative to
 * the working directory
 *
 * @type { String }
 */
const WORKER_ENTRYPOINT_PATH = path.join(__dirname, '../worker.js')

/**
 * Initialize a new context for a
 * plugin from its manifest
 * @param { PluginManifest } manifest
 * @returns { PluginContext }
 */
function factory (manifest) {
  const ctx = {
    version: process.env.npm_package_version,
    manifest,
    state: State.getInstance()
  }

  /**
   * Activate the plugin
   * in a worker thread
   */
  function activate () {
    const worker = new Worker(WORKER_ENTRYPOINT_PATH, {
      workerData: {
        manifest: manifest
      }
    })

    worker.on('message', msg => {
      console.log('Received message', msg)
    })
    worker.postMessage({ foo: 'bar' })

    ctx.worker = worker
  }
  ctx.activate = activate

  /**
   * Apply another object to the context
   * in order to add functionality
   *
   * This is a helper function for
   * following the compose pattern
   * @param { Object } obj
   */
  function apply (obj) {
    Object.assign(ctx, obj)
  }
  ctx.apply = apply

  return ctx
}

exports.factory = factory

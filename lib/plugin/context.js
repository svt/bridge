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
 *  worker: Worker,
 *  activate: activate,
 *  deactivate: deactivate
 *  apply: (Object) => Void
 * }} PluginContext
 */

const uuid = require('uuid')

const path = require('path')
const { Worker } = require('worker_threads')

const Logger = require('../Logger')
const logger = new Logger({ name: 'PluginContext' })

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
const WORKER_ENTRYPOINT_PATH = path.join(__dirname, './worker.js')

/**
 * Initialize a new context for a
 * plugin from its manifest
 * @param { PluginManifest } manifest
 * @returns { PluginContext }
 */
function factory (workspace, manifest) {
  /**
   * @type { PluginContext }
   */
  const ctx = {
    id: uuid.v4(),
    version: process.env.npm_package_version,
    manifest,
    workspace
  }

  /**
   * Activate the plugin
   * in a worker thread
   */
  function activate () {
    ctx.worker = new Worker(WORKER_ENTRYPOINT_PATH, {
      workerData: {
        manifest: manifest
      }
    })

    ctx.worker.on('exit', () => {
      /*
      Clear all commands registered
      by this context
      */
      ctx.workspace.api.commands.removeAllByOwner(ctx.id)
    })

    /*
    Handle messages from the worker and overwrite the
    registerCommand function in order to provide a handler
    function that always sends the response to this worker
    */
    ctx.worker.on('message', msg => {
      if (msg.command === 'commands.registerCommand') {
        /**
         * msg.args will be an array of arguments
         * where the first argument is the identifier
         * of the command to call
         *
         * See the implementation of
         * the original registerCommand
         * function
         *
         * @see /lib/api/index.js
         */
        ctx.workspace.api.commands.registerCommand(msg.args[0], (...args) => {
          ctx.worker.postMessage({
            command: msg.args[0],
            args
          })
        }, ctx.id)
        return
      }

      if (msg.command === 'events.triggerCommand') {
        ctx.workspace.api.commands.executeCommand(msg.command, ...(msg.args || []), ctx.id)
        return
      }

      ctx.workspace.api.commands.executeCommand(msg.command, ...(msg.args || []))
    })
  }
  ctx.activate = activate

  /**
   * Deactivate the context by
   * terminating the worker thread
   */
  function deactivate () {
    ctx.worker.terminate()
      .catch(err => {
        logger.error('Unable to terminate worker', err)
      })
  }
  ctx.deactivate = deactivate

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

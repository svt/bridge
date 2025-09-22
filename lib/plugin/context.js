// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const uuid = require('uuid')

const path = require('path')
const { Worker } = require('worker_threads')

const Logger = require('../Logger')
const logger = new Logger({ name: 'PluginContext' })

const WorkerError = require('../error/WorkerError')

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
  const pluginCtx = {
    id: uuid.v4(),
    version: process.env.npm_package_version,
    manifest,
    workspace
  }

  /**
   * The security context which will be used
   * for authorization when running commands
   *
   * @type { import('../api/SCommands').SCommandsSecurityContext }
   */
  const securityCtx = {
    type: 'plugin',
    plugin: pluginCtx
  }

  /**
   * Activate the plugin
   * in a worker thread
   */
  function activate () {
    pluginCtx.worker = new Worker(WORKER_ENTRYPOINT_PATH, {
      workerData: {
        manifest
      }
    })

    pluginCtx.worker.on('exit', () => {
      /*
      Clear all commands registered
      by this context
      */
      pluginCtx.workspace.api.commands.removeAllByOwner(pluginCtx.id)
    })

    pluginCtx.worker.on('error', err => {
      /*
      Show worker errors as messages in the UI
      */
      if (err.code === new WorkerError().code) {
        workspace.api.messages.createWarningMessage({
          text: `${manifest.name}: ${err.message}`
        })
        logger.warn('Worker erixed due to error', err)
        return
      }
      throw err
    })

    /*
    Handle messages from the worker and overwrite the
    registerCommand function in order to provide a handler
    function that always sends the response to this worker
    */
    pluginCtx.worker.on('message', msg => {
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
        pluginCtx.workspace.api.commands.registerCommand(msg.args[0], (...args) => {
          pluginCtx.worker.postMessage({
            command: msg.args[0],
            args
          })
        }, pluginCtx.id)
        return
      }

      if (msg.command === 'events.triggerCommand') {
        pluginCtx.workspace.api.commands.authorizeAndExecuteCommand(securityCtx, msg.command, ...(msg.args || []), pluginCtx.id)
        return
      }

      pluginCtx.workspace.api.commands.authorizeAndExecuteCommand(securityCtx, msg.command, ...(msg.args || []))
    })
  }
  pluginCtx.activate = activate

  /**
   * Deactivate the context by
   * terminating the worker thread
   */
  function deactivate () {
    pluginCtx.worker.terminate()
      .catch(err => {
        logger.error('Unable to terminate worker', err)
      })
  }
  pluginCtx.deactivate = deactivate

  /**
   * Apply another object to the context
   * in order to add functionality
   *
   * This is a helper function for
   * following the compose pattern
   * @param { Object } obj
   */
  function apply (obj) {
    Object.assign(pluginCtx, obj)
  }
  pluginCtx.apply = apply

  return pluginCtx
}

exports.factory = factory

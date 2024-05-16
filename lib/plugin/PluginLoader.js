// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const path = require('path')
const assert = require('assert')

const context = require('./context')
const ContextStore = require('./ContextStore')

const ContributionLoader = require('./ContributionLoader')
const contributionLoader = new ContributionLoader()

const Logger = require('../Logger')
const logger = new Logger({ name: 'PluginLoader' })

const Validator = require('../Validator')
const PluginMissingMainScriptError = require('../error/PluginMissingMainScriptError')

class PluginLoader {
  /**
   * Create a new
   * PluginLoader
   *
   * @typedef {{
   *  paths: String[],
   *  workspace: import('../Workspace')
   * }} PluginLoaderOpts
   *
   * @param { PluginLoaderOpts } opts
   */
  constructor (opts) {
    /**
     * @private
     */
    this._opts = opts
    this.contexts = new ContextStore()

    assert(opts.paths?.length > 0, 'Missing required property paths in options object')
  }

  /**
   * Validate a plugin manifest
   * @param { PluginManifest } manifest
   * @returns { Promise.<boolean> }
   */
  validateManifest (manifest) {
    return new Promise((resolve, reject) => {
      const validate = Validator.getPluginValidator()
      const valid = validate(manifest)

      if (valid) return resolve(true)

      const error = Validator.getFirstError(validate)
      error.code = 'ERR_VALIDATION_INVALID_MANIFEST'
      reject(error)
    })
  }

  /**
   * Load a plugin
   * @param { String } absBundlePath
   */
  async load (absBundlePath) {
    const manifest = await this.parseManifest(absBundlePath)
    logger.debug('Loading plugin', manifest.name)

    const valid = await this.validateManifest(manifest)
    if (!valid) {
      logger.warn('Plugin', manifest.name, 'cannot be loaded, invalid manifest')
      return
    }

    if (this.contexts.get(manifest.name)) {
      logger.warn('Plugin', manifest.name, 'has already been loaded, skipping')
      return
    }

    if (manifest.contributes) {
      contributionLoader.loadFromManifest(manifest, this._opts.workspace.api)
    }

    try {
      /*
      Verify that the plugin has a main script,
      as we won't create a new context otherwise
      */
      await fs.promises.stat(path.join(manifest._path, manifest.main || 'index.js'))
        .catch(() => { throw new PluginMissingMainScriptError() })

      const ctx = context.factory(this._opts.workspace, manifest)
      this.contexts.add(manifest.name, ctx)

      ctx.activate()
      logger.debug('Did activate plugin', manifest.name)
    } catch (err) {
      if (err instanceof PluginMissingMainScriptError) {
        logger.debug('Plugin has no main script, skipping initialization of context for', manifest.name)
        return
      }
      logger.warn('Failed to load plugin', manifest._path, 'in bundle', manifest.name)
      logger.warn(err)
    }
  }

  /**
   * Parse the manifest for a bunldle from
   * the path to its directory
   * @param { String } absBundlePath The plugin's path, relative to
   *                                 the path setup for the loader
   * @returns { Promise.<PluginManifest> }
   */
  async parseManifest (absBundlePath) {
    try {
      const manifestPath = path.join(absBundlePath, 'package.json')
      const manifest = await fs.promises.readFile(manifestPath)
      const json = JSON.parse(manifest)
      return {
        ...json,
        _path: absBundlePath
      }
    } catch (err) {
      Logger.error('Unable to parse plugin manifest at', absBundlePath, err)
    }
  }

  /**
   * List all installed
   * bundles' manifests
   * @returns { Promise.<PluginManifest[]> }
   */
  async list () {
    /*
    Create an array of all direct children
    to all the paths of this loader
    */
    const promises = this._opts.paths.map(dirpath => {
      return fs.promises.readdir(dirpath)
        .then(paths => paths.map(filepath => path.join(dirpath, filepath)))
    })

    const dirs = (await Promise.all(promises))
      .reduce((prev, cur) => {
        return prev.concat(cur)
      }, [])

    /*
    Parse the manifest files from
    all the found directories
    */
    const bundles = await Promise.all(dirs.map(async pluginpath => {
      const stat = await fs.promises.stat(pluginpath)
      if (!stat.isDirectory()) return

      return this.parseManifest(pluginpath)
    }))

    return bundles
      .filter(bundle => bundle)
  }

  /**
   * Tear down the loader
   * and all plugin contexts
   */
  teardown () {
    this.contexts.teardown()
  }
}

module.exports = PluginLoader

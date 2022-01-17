/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  type: String,
 *  path: String
 * }} Plugin
 *
 * @typedef {{
 *  bundle: String,
 *  version: String,
 *  plugins: Plugin[],
 *  _path: String
 * }} PluginManifest
 */

const fs = require('fs')
const path = require('path')
const assert = require('assert')

const context = require('./context')
const contextFile = require('./context/file')
const contextComponent = require('./context/component')

const ContextStore = require('./ContextStore')

const Logger = require('../Logger')
const logger = new Logger({ name: 'PluginLoader' })

class PluginLoader {
  /**
   * Create a new
   * PluginLoader
   *
   * @typedef {{
   *  path: String
   * }} PluginLoaderOpts
   *
   * @param { PluginLoaderOpts } opts
   */
  constructor (opts) {
    /**
     * @private
     */
    this._opts = opts
    assert(opts.path, 'Missing required property path in options object')
  }

  /**
   * Load a bundle and run all of
   * its registered plugins
   * @param { String } absBundlePath
   */
  async load (absBundlePath) {
    const manifest = await this.manifest(absBundlePath)
    logger.debug('Loading plugin', manifest.bundle)

    if (ContextStore.getInstance().get(manifest.bundle)) {
      logger.warn('Plugin', manifest.bundle, 'has already been loaded, skipping')
      return
    }

    try {
      const plugin = require(manifest._path)

      /*
      Compose the plugin's context
      */
      const ctx = context.factory(manifest)
      ctx.apply(contextFile.factory(ctx))
      ctx.apply(contextComponent.factory(ctx))

      /*
      Store the created context
      in the context store
      */
      ContextStore.getInstance().add(manifest.bundle, ctx)

      plugin?.init(ctx)
    } catch (err) {
      logger.warn('Failed to load plugin', manifest._path, 'in bundle', manifest.bundle)
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
  async manifest (absBundlePath) {
    try {
      const manifestPath = path.join(absBundlePath, 'manifest.json')
      const manifest = await fs.promises.readFile(manifestPath)
      const json = JSON.parse(manifest)
      return {
        ...json,
        _path: absBundlePath
      }
    } catch (err) {
      Logger.error('Unable to parse bundle manifest for', absBundlePath, err)
    }
  }

  /**
   * List all installed
   * bundles' manifests
   * @returns { Promise.<PluginManifest[]> }
   */
  async list () {
    const dirs = await fs.promises.readdir(this._opts.path)

    /*
    Parse the manifest files from
    all the found directories
    */
    const bundles = await Promise.all(dirs.map(async dir => {
      const stat = await fs.promises.stat(path.join(this._opts.path, dir))
      if (!stat.isDirectory()) return

      const absPath = path.join(this._opts.path, dir)
      return this.manifest(absPath)
    }))

    return bundles
      .filter(bundle => bundle)
  }
}

module.exports = PluginLoader

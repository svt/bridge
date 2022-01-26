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
   * Load a bundle and run all of
   * its registered plugins
   * @param { String } absBundlePath
   */
  async load (absBundlePath) {
    const manifest = await this.manifest(absBundlePath)
    logger.debug('Loading plugin', manifest.bundle)

    if (this.contexts.get(manifest.bundle)) {
      logger.warn('Plugin', manifest.bundle, 'has already been loaded, skipping')
      return
    }

    try {
      /*
      Compose the plugin's context
      */
      const ctx = context.factory(this._opts.workspace, manifest)
      ctx.apply(contextFile.factory(ctx))
      ctx.apply(contextComponent.factory(ctx))

      /*
      Store the created context
      in the context store
      */
      this.contexts.add(manifest.bundle, ctx)

      ctx.activate()
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

      return this.manifest(pluginpath)
    }))

    return bundles
      .filter(bundle => bundle)
  }
}

module.exports = PluginLoader

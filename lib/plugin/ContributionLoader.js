// SPDX-FileCopyrightText: 2022 Sveriges Television AB

//
// SPDX-License-Identifier: MIT

const Logger = require('../Logger')
const logger = new Logger({ name: 'ContributionLoader' })

class ContributionLoader {
  /**
   * @typedef {{
   *  workspace: import('../Workspace')
   * }} ContributionLoaderOpts
   * @param { ContributionLoaderOpts } opts
   */
  constructor (opts = {}) {
    /**
     * @private
     * @type { ContributionLoaderOpts }
     */
    this._opts = opts
  }

  /**
   * Load contributions from
   * a plugin manifest
   * @param { import('./PluginManifest').PluginManifest } manifest
   */
  loadFromManifest (manifest) {
    logger.debug('Loading contributions from manifest for', manifest.name)

    const types = this.getTypes(manifest)
    for (const type of types) {
      try {
        this._opts.workspace.api.types.registerType(type)
      } catch (err) {
        logger.warn(err.message)
      }
    }
  }

  /**
   * Get the contributing types
   * from a plugin manifest
   * @param { import('./PluginManifest').PluginManifest } manifest
   * @returns { import('./PluginManifest').PluginType[] }
   */
  getTypes (manifest) {
    return manifest?.contributes?.types || []
  }
}
module.exports = ContributionLoader

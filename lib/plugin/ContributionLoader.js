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

    /*
    Define what contributions that should
    be loaded from the manifest so that we
    can go through them in a generic loop
    below
    */
    const contributionKinds = [
      { extract: this.getTypes, register: this._opts.workspace.api.types.registerType },
      { extract: this.getSettings, register: this._opts.workspace.api.settings.registerSetting },
      { extract: this.getShortcuts, register: this._opts.workspace.api.shortcuts.registerShortcut }
    ]

    for (const kind of contributionKinds) {
      const contributions = kind.extract(manifest)

      for (const contribution of contributions) {
        try {
          kind.register(contribution)
        } catch (err) {
          logger.warn('Failed to register contribution:', err.message)
        }
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

  /**
   * Get the contributing settings
   * from a plugin manifest
   * @param { import('./PluginManifest').PluginManifest } manifest
   * @returns { any[] }
   */
  getSettings (manifest) {
    return manifest?.contributes?.settings || []
  }

  /**
   * Get the contributing shortcuts
   * from a plugin manifest
   * @param { import('./PluginManifest').PluginManifest } manifest
   * @returns { import('./PluginManifest').PluginSchortcut[] }
   */
  getShortcuts (manifest) {
    return manifest?.contributes?.shortcuts || []
  }
}
module.exports = ContributionLoader

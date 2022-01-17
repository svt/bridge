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

const State = require('../../State')

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

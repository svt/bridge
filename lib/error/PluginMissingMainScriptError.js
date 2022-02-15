/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

class PluginMissingMainScriptError extends Error {
  constructor () {
    super('Plugin has no main script')
    this.name = 'PluginMissingMainScriptError'
    this.code = 'ERR_PLUGIN_MISSING_MAIN_SCRIPT'
  }
}

module.exports = PluginMissingMainScriptError

const pkg = require('../../package.json')

/**
 * A factory function
 * for the system API
 * @param { import('./index.js').Api } api
 */
function factory (api) {
  api.system = {}

  /**
   * Get the system version
   * @returns { String }
   */
  function getVersion () {
    return pkg.version || 'unknown'
  }
  api.system.getVersion = getVersion
  api.commands.registerAsyncCommand('system.getVersion', getVersion)
}
exports.factory = factory

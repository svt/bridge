const pkg = require('../../package.json')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

class SSystem extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('system.getVersion', this.getVersion.bind(this))
  }

  /**
   * Get the system version
   * @returns { String }
   */
  getVersion () {
    return pkg.version || 'unknown'
  }
}

DIController.main.register('SSystem', SSystem, [
  'SCommands'
])

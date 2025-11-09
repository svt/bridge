const DIController = require('../shared/DIController')

class System {
  #props

  /**
   * The version string as
   * returned by getVersion
   *
   * This is only used as a cache
   * and should not be accessed directly
   *
   * @type { String | undefined }
   */
  #version

  constructor (props) {
    this.#props = props
  }

  /**
   * Get the system version
   * @returns { Promise.<String> }
   */
  getVersion () {
    /*
    Return the stored version as it
    only has to be fetched once
    */
    if (this.#version) {
      return this.#version
    }

    return this.#props.Commands.executeCommand('system.getVersion')
      .then(res => {
        this.#version = res
        return res
      })
  }

  /**
   * Log a message to the system log
   * @param { String } message
   * @returns { Promise.<Void> }
   */
  log (message) {
    return this.#props.Commands.executeCommand('system.log', message)
  }
}

DIController.main.register('System', System, [
  'Commands'
])

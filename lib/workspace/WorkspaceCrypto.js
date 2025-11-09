const DIController = require('../../shared/DIController')

const EC = require('../security/EC')

const Logger = require('../Logger')
const logger = new Logger({ name: 'WorkspaceCrypto' })

class WorkspaceCrypto {
  #keyPair

  /**
   * Get the key pair used
   * for this instance
   *
   * This is used to sign
   * access tokens for the
   * enclosing workspace
   * @returns { Promise.<import('../security/EC').ECKeyPair> }
   */
  async getKeyPair () {
    if (!this.#keyPair) {
      this.#keyPair = await EC.generateKeyPair()
      logger.debug('Generated new EC key')
    }
    return Promise.resolve(this.#keyPair)
  }
}

DIController.main.register('WorkspaceCrypto', WorkspaceCrypto)

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Auth api' })

const PolicyAgent = require('../security/PolicyAgent')
const JWT = require('../security/JWT')

const ApiError = require('../error/ApiError')

const rules = require('./rules')

class SAuth extends DIBase {
  #policyAgent = new PolicyAgent(rules, { detailedResponse: true })

  /**
   * Authorize a command using
   * its context and arguments
   * @param { string } command
   * @param { any[] } args
   * @param { string }
   * @returns { boolean }
   */
  async authorizeCommand (command, args, token) {
    let context = {}

    if (token) {
      const { publicKey } = await this.props.Workspace.crypto.getKeyPair()

      try {
        const { payload: _payload } = await JWT.verify(token, publicKey, JWT.DEFAULT_ALG)
        context = {
          ..._payload
        }
      } catch {
        logger.warn('Invalid token, failed to verify')
        throw new ApiError('Unauthorized', 'ERR_API_AUTH_UNAUTHORIZED')
      }
    }

    const { granted, reason } = this.#policyAgent.authorize({
      args,
      command,
      context
    })

    if (!granted) {
      logger.debug(`Command "${command}" unauthorised`, { reason })
      throw new ApiError('Unauthorized', 'ERR_API_AUTH_UNAUTHORIZED')
    }

    return granted
  }
}

DIController.main.register('SAuth', SAuth, [
  'Workspace'
])

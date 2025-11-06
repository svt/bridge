const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const PolicyAgent = require('../security/PolicyAgent')

const rules = require('./rules')

/**
 * @typedef {{
 *  type: 'plugin' | 'client' | 'system',
 *  plugin: any | undefined
 * }} SCommandsSecurityContext
 */

class SAuth extends DIBase {
  #policyAgent = new PolicyAgent(rules, { detailedResponse: true })

  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.registerCommand('commands.removeCommand', this.removeCommand.bind(this))
    this.registerCommand('commands.registerCommand', this.registerCommand.bind(this))
    this.registerCommand('commands.removeAllByOwner', this.removeAllByOwner.bind(this))
  }
}

DIController.main.register('SAuth', SAuth)

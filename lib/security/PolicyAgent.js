const { Agent } = require('node-policy-agent')

const PolicyError = require('../error/PolicyError')

class PolicyAgent {
  #agent

  constructor (rules) {
    this.#agent = new Agent(rules, { detailedResponse: true })
  }

  authorize (...args) {
    try {
      return this.#agent.authorize(...args)
    } catch (err) {
      if (err instanceof PolicyError) {
        return { granted: false, reason: err.reason }
      }
      throw err
    }
  }
}

module.exports = PolicyAgent

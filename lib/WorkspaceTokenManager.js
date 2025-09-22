// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const LazyValue = require('../shared/LazyValue')

const DIController = require('../shared/DIController')
const DIBase = require('../shared/DIBase')

const EC = require('./security/EC')

class WorkspaceTokenManager extends DIBase {
  #keyPair = new LazyValue()

  constructor (props) {
    super(props)
    this.#setup()
  }

  async #setup () {
    /*
    Generate a key pair that
    can be used for signing
    */
    const keyPair = await EC.generateKeyPair()
    this.#keyPair.set(keyPair)
  }

  async createAccessToken (workspace, body = {}) {
    const keyPair = await this.#keyPair.getLazy()
    return this.props.JWT.sign({
      aud: workspace.id,
      ...body
    }, keyPair.privateKey, 'ES256')
  }
}

DIController.main.register('WorkspaceTokenManager', WorkspaceTokenManager, [
  'JWT'
])

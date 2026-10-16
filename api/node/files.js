// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const Files = require('../shared/files')

class NodeFiles extends Files {
  /**
   * Send the bytes through the transport
   * @see Files#upload
   */
  async upload (data, type) {
    const { body, type: _type } = this.normalizeUpload(data, type)
    const bytes = body instanceof Uint8Array ? body : new Uint8Array(await body.arrayBuffer())
    return this.props.Commands.executeCommand('files.upload', bytes, _type)
  }
}

DIController.main.register('Files', NodeFiles, [
  'Commands'
])

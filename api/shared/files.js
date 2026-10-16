// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIBase = require('../../shared/DIBase')

/**
 * @typedef {{
 *  id: String,
 *  type: String,
 *  size: Number
 * }} File
 */

/**
 * Decode base64 to bytes
 * @param { String } str
 * @returns { Uint8Array }
 */
function fromBase64 (str) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64'))
  }
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

/**
 * The environment independent
 * parts of the files api
 *
 * Subclasses must implement upload
 */
class Files extends DIBase {
  /**
   * List the files stored in the project file
   * @returns { Promise.<File[]> }
   */
  list () {
    return this.props.Commands.executeCommand('files.list')
  }

  /**
   * Get the metadata of a file
   * @param { String } id
   * @returns { Promise.<File?> }
   */
  get (id) {
    return this.props.Commands.executeCommand('files.get', id)
  }

  /**
   * Read the contents of a file
   * @param { String } id
   * @returns { Promise.<Uint8Array> }
   */
  async read (id) {
    const base64 = await this.props.Commands.executeCommand('files.read', id)
    return fromBase64(base64)
  }

  /**
   * Store a file in the project file,
   * identical contents are only stored once
   * @param { Blob | ArrayBuffer | Uint8Array | String } data The contents of the file,
   *                                                          strings are encoded as UTF-8
   * @param { String= } type A mime type, defaults to the type of a Blob
   * @returns { Promise.<File> }
   */
  upload (data, type) {
    throw new Error('Not implemented')
  }

  /**
   * Delete a file
   * @param { String } id
   * @returns { Promise.<Boolean> } True if a file was deleted
   */
  delete (id) {
    return this.props.Commands.executeCommand('files.delete', id)
  }

  /**
   * Delete all files
   * @returns { Promise.<Number> } The number of files deleted
   */
  clear () {
    return this.props.Commands.executeCommand('files.clear')
  }

  /**
   * Normalize upload data to a Blob or Uint8Array
   * and resolve its mime type
   * @protected
   * @param { Blob | ArrayBuffer | Uint8Array | String } data
   * @param { String= } type
   * @returns {{ body: Blob | Uint8Array, type: String? }}
   */
  normalizeUpload (data, type) {
    /*
    Widgets run in iframes where instanceof Blob fails
    for files created in another window
    */
    if (typeof data?.arrayBuffer === 'function' && typeof data?.type === 'string') {
      return { body: data, type: type || data.type || undefined }
    }
    if (typeof data === 'string') {
      return { body: new TextEncoder().encode(data), type }
    }
    if (data instanceof ArrayBuffer) {
      return { body: new Uint8Array(data), type }
    }
    if (ArrayBuffer.isView(data)) {
      return { body: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), type }
    }
    throw new TypeError('File data must be a Blob, ArrayBuffer, typed array or string')
  }
}

module.exports = Files

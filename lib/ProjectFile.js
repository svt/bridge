// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const JSZip = require('jszip')

const Workspace = require('./Workspace')

const Logger = require('./Logger')
const logger = new Logger({ name: 'ProjectFile' })

class ProjectFile {
  /**
   * The singleton instance
   * of this class
   * @type { ProjectFile }
   */
  static main = new ProjectFile()
  
  /**
   * Create a writable archive
   * at the given filePath
   * @param { String } filePath
   * @returns {{
   *   finalize: { Function },
   *   zip: JSZip
   * }}
   */
  createArchive (filePath) {
    const zip = new JSZip()
    function finalize () {
      try {
        const ws = fs.createWriteStream(filePath)
        const rs = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        rs.pipe(ws)
        logger.debug('Writing workspace archive to', filePath)
      } catch (err) {
        logger.error('Unable to write workspace archive', err)
      }
    }
    
    return {
      zip,
      finalize
    }
  }
  
  /**
   * Read a zip archive
   * from a file path
   * @param { String } filePath
   * @returns { JSZip }
   */
  async readArchive (filePath) {
    const data = await fs.promises.readFile(filePath)
    return JSZip.loadAsync(data)
  }
  
  /**
   * Write the provided workspace
   * as a zipped workspace file
   * at the provided filePath
   * @param { String } filePath
   * @param { Workspace } workspace
   */
  writeWorkspace (filePath, workspace) {
    const archive = this.createArchive(filePath)
    archive.zip.file('state.json', workspace.state.toStaticString(), { binary: true })
    archive.finalize()
  }
  
  /**
   * Read a workspace from
   * a project file
   * @param { String } filePath
   * @returns { Promise.<Workspace?> }
   */
  async readWorkspace (filePath) {
    const zip = await this.readArchive(filePath)
    
    if (!zip.files['state.json']) {
      logger.warn('Invalid workspace file, missing state.json, aborting')
      return
    }
    
    try {
      const stateStr = await zip.files['state.json'].async('text')
      const state = JSON.parse(stateStr)

      return new Workspace(state)
    } catch (err) {
      logger.error('Unable to parse state, aborting', err)
    }
  }
}
module.exports = ProjectFile

/**
 * A collection of file extensions
 * to be used with this module
 */
module.exports.extensions = Object.freeze({
  workspace: 'bridge'
})

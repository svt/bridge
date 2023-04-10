// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Logger = require('./Logger')
const logger = new Logger({ name: 'WorkspaceRegistry' })

class WorkspaceRegistry {
  /**
   * Get the singleton instance
   * of this class
   * @returns { WorkspaceRegistry }
   */
  static getInstance () {
    if (!this._instance) {
      this._instance = new WorkspaceRegistry()
    }
    return this._instance
  }

  constructor () {
    /**
     * @private
     */
    this._map = new Map()
  }

  /**
   * Add a new workspace
   * to the registry
   * @param { Workspace } Workspace
   */
  add (Workspace) {
    this._map.set(Workspace.id, Workspace)
  }

  /**
   * Get a workspace
   * from the registry
   * @param { String } id
   * @returns { Workspace || undefined }
   */
  get (id) {
    return this._map.get(id)
  }

  /**
   * Delete a workspace
   * from the registry
   * @param { String } id
   */
  delete (id) {
    logger.debug('Removing workspace with id', id)
    this._map.delete(id)
  }

  /**
   * Get an array of all workspaces
   * currently in the registry
   * @returns { Workspace[] }
   */
  list () {
    return Array.from(this._map.values())
  }
}
module.exports = WorkspaceRegistry

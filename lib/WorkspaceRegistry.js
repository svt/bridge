// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const EventEmitter = require('events')

const Logger = require('./Logger')
const logger = new Logger({ name: 'WorkspaceRegistry' })

const DIController = require('../shared/DIController')

class WorkspaceRegistry extends EventEmitter {
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
    super()

    /**
     * @private
     */
    this._map = new Map()
  }

  /**
   * Add a new workspace
   * to the registry
   * @param { Workspace } workspace
   */
  add (workspace) {
    this._map.set(workspace.id, workspace)
    this.emit('add', workspace)
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

  create () {
    const workspace = DIController.main.instantiate('WorkspaceRoot')
    workspace.setup()

    this.add(workspace)
    return workspace.id
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

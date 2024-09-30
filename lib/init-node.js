// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs')

const paths = require('./paths')
const UserDefaults = require('./UserDefaults')
const WorkspaceRegistry = require('./WorkspaceRegistry')

const Logger = require('./Logger')
const logger = new Logger({ name: 'init-node' })

/**
* The minimum threshold after creation
* that a workspace can be teared down,
* assuming no connections
* @type { Number }
*/
const WORKSPACE_TEARDOWN_MIN_THRESHOLD_MS = 20000

/*
Write the user defaults-state to disk
before the process exits
*/
function writeUserDeafults () {
  logger.debug('Writing user defaults to disk')
  fs.writeFileSync(paths.userDefaults, JSON.stringify(UserDefaults.data))
}

process.on('exit', () => writeUserDeafults())

process.on('SIGTERM', () => {
  writeUserDeafults()
  process.exit(0)
})

process.on('SIGINT', () => {
  writeUserDeafults()
  process.exit(0)
})

/*
Setup listeners for new workspaces
in order to remove any dangling
references
*/
WorkspaceRegistry.getInstance().on('add', async workspace => {
  const creationTimeStamp = Date.now()

  function conditionalTeardownWorkspaces () {
    /*
    Make sure that we've given clients
    a timeframe to connect before
    terminating the workspace
    */
    if (Date.now() - creationTimeStamp < WORKSPACE_TEARDOWN_MIN_THRESHOLD_MS) {
      return
    }

    if (Object.keys(workspace?.state?.data?._connections || {}).length > 0) {
      return
    }

    logger.debug('Tearing down workspace', workspace.id)
    WorkspaceRegistry.getInstance().delete(workspace.id)
    workspace.teardown()
  }

  workspace.on('cleanup', async () => {
    workspace.cleanupSockets()
    conditionalTeardownWorkspaces()
  })
})

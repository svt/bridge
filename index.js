// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const WorkspaceRegistry = require('./lib/WorkspaceRegistry')
const platform = require('./lib/platform')

/*
Do required initialization
*/
require('./lib/init-common')
require('./lib/server')

if (platform.isElectron()) {
  require('./lib/init-electron')
} else {
  require('./lib/init-node')
}

/**
* The minimum threshold after creation
* that a workspace can be teared down,
* assuming no connections
* @type { Number }
*/
const WORKSPACE_TEARDOWN_MIN_THRESHOLD_MS = 20000

/*
Setup listeners for new workspaces
in order to remove any dangling
references
*/
;(function () {
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

      WorkspaceRegistry.getInstance().delete(workspace.id)
      workspace.teardown()
    }

    workspace.on('cleanup', async () => {
      workspace.cleanupSockets()

      /*
      Skip unloading workspaces if running
      in electron as we'd rather tear them
      down on application close
      */
      if (!platform.isElectron()) {
        conditionalTeardownWorkspaces()
      }
    })
  })
})()

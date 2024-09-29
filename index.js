// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const url = require('url')
const path = require('path')

const express = require('express')
const app = express()

const WorkspaceRegistry = require('./lib/WorkspaceRegistry')
const Workspace = require('./lib/Workspace')

const UserDefaults = require('./lib/UserDefaults')

const HttpError = require('./lib/error/HttpError')
const Logger = require('./lib/Logger')

const template = require('./app/template')

const network = require('./lib/network')
const platform = require('./lib/platform')
const apiRoutes = require('./lib/routes')

const pkg = require('./package.json')
const config = require('./lib/config')

/*
Do required initialization
*/
require('./lib/init-common')
if (platform.isElectron()) {
  require('./lib/init-electron')
} else {
  require('./lib/init-node')
}

/**
 * @type { Number }
 */
const DEFAULT_HTTP_PORT = config.defaults.HTTP_PORT
const ASSETS = require('./assets.json')

/**
* The minimum threshold after creation
* that a workspace can be teared down,
* assuming no connections
* @type { Number }
*/
const WORKSPACE_TEARDOWN_MIN_THRESHOLD_MS = 20000

/*
These constants depend on the UserDefaults-state and
MUST be declared AFTER initialization
*/
const HTTP_PORT = UserDefaults.data.httpPort || DEFAULT_HTTP_PORT
const HTTP_BIND_ADDR = UserDefaults.data.httpBindToAll ? '0.0.0.0' : 'localhost'

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

app.disable('x-powered-by')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'dist')))

/**
 * A reference to
 * the main http server
 * @type { HttpError.Server }
 */
const server = app.listen(HTTP_PORT, HTTP_BIND_ADDR, () => {
  Logger.info('Listening on port', HTTP_PORT)
})

;(function () {
  if (process.env.NODE_ENV === 'development') {
    /*
     Allow any origin to access the API
     if running in development mode
     */
    Logger.info('Access-Control-Allow-Origin=*')
    Logger.info('Access-Control-Allow-Headers=*')
    Logger.info('Access-Control-Allow-Methods=*')
    app.use((req, res, next) => {
      res.set('Access-Control-Allow-Origin', '*')
      res.set('Access-Control-Allow-Headers', '*')
      res.set('Access-Control-Allow-Methods', '*')
      next()
    })
  }
})()

/*
Forward websocket requests
to the socket handler
*/
server.on('upgrade', (req, sock, head) => {
  /*
  Parse the url to get a clean
  pathname and Workspace id
  */
  const _url = new url.URL(req.url, 'http://localhost')
  if (_url.pathname !== '/api/v1/ws') return

  const workspaceId = _url.searchParams.get('workspace')
  const workspace = WorkspaceRegistry.getInstance().get(workspaceId)

  if (!workspace) {
    Logger.warn('Closed websocket connection to a non existing workspace')
    sock.end()
    return
  }

  workspace.socket.upgrade(req, sock, head)
})

app.get('/workspaces/new', (req, res, next) => {
  const workspace = new Workspace()
  WorkspaceRegistry.getInstance().add(workspace)
  res.redirect(`/workspaces/${workspace.id}`)
})

/*
Keep workspaces under /workspaces/:id
in order to not trigger their creation
when going to paths such as /favicon.ico
*/
app.use('/workspaces/:workspace', (req, res, next) => {
  const id = req.params.workspace
  const workspace = WorkspaceRegistry.getInstance().get(id)

  if (!workspace) {
    Logger.debug('Tried to access non-existing workspace, redirecting to new')
    /*     res.redirect('/new') */
    return
  }

  /*
  Set a reference to the Workspace
  to the request object for further
  requests to make use of
  */
  req.workspace = workspace
  next()
})

/*
Redirect all users requesting
the root to a new workspace
*/
app.get('/', (req, res, next) => {
  return res.redirect('/workspaces/new')
})

/*
Attach the main routes
to the Express application
*/
app.use('/api/v1', apiRoutes)

/*
Fallback to responding
with the client app
*/
app.get('*', (req, res, next) => {
  res.send(template({
    env: process.env.NODE_ENV,
    port: HTTP_PORT,
    address: HTTP_BIND_ADDR === '0.0.0.0' && platform.isElectron() ? network.getFirstIPv4Address() : 'localhost',
    version: pkg.version,
    platform: process.platform,
    workspace: req.workspace?.id,
    hostProtocol: process.env.HOST_PROTOCOL
  }, ASSETS.assets))
})

app.use((err, req, res, next) => {
  let _err = err
  Logger.error(_err.message)
  Logger.raw(_err)

  if (!err.status || err.status === 500) {
    _err = new HttpError('Internal server error', 'ERR_INTERNAL_SERVER_ERROR', 500)
  }

  return res
    .status(_err.status)
    .json({
      name: _err.name,
      code: _err.code,
      description: _err.message
    })
})

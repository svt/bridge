// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const url = require('url')
const path = require('path')
const assert = require('assert')

const express = require('express')
const app = express()

const WorkspaceRegistry = require('./lib/WorkspaceRegistry')
const Workspace = require('./lib/Workspace')

const UserDefaults = require('./lib/UserDefaults')

const HttpError = require('./lib/error/HttpError')
const Logger = require('./lib/Logger')

const template = require('./app/template')

const utils = require('./lib/utils')
const paths = require('./lib/paths')
const electron = require('./lib/electron')
const platform = require('./lib/platform')
const apiRoutes = require('./lib/routes')

const pkg = require('./package.json')

/**
 * @type { Number }
 */
const DEFAULT_HTTP_PORT = 5544
const ASSETS = require('./assets.json')

/**
* The minimum threshold after creation
* that a workspace can be teared down,
* assuming no connections
* @type { Number }
*/
const WORKSPACE_TEARDOWN_MIN_THRESHOLD_MS = 20000

/**
 * The amount of time cleanups should wait before
 * resuming after the app has been suspended,
 * @type { Number }
 */
const WORKSPACE_RESUME_CLEANUP_DELAY_MS = 20000

/**
 * Verify that an assets file is
 * created before running the app,
 * hashes are used in order to eliminate
 * caching issues
 */
;(function () {
  const assetsExist = fs.existsSync(path.join(__dirname, './assets.json'))
  assert(
    assetsExist,
    'No assets file found, the project must be built before it\'s run: \'npm build\''
  )
})()

/**
 * Create the plugin directories
 * if they don't already exist
 */
;(function () {
  Logger.debug('Creating plugin directory')
  utils.createDirectoryRecursively(paths.plugins)
})()

/**
 * Remove and recreate the temporary directory
 * in order to make sure that it's cleared and
 * exists
 */
;(function () {
  Logger.debug('Recreating temporary directory')
  try {
    fs.rmdirSync(paths.temp, { force: true, recursive: true })
  } catch (err) {
    Logger.warn('Failed to remove temporary files directory', err)
  }
  utils.createDirectoryRecursively(paths.temp)
})()

/**
 * Restore user defaults into
 * the user defaults-state
 */
;(async function () {
  Logger.debug('Restoring user deafults', paths.userDefaults)
  try {
    const data = fs.readFileSync(paths.userDefaults, { encoding: 'utf8' })
    const json = JSON.parse(data || '{}')

    UserDefaults.apply({
      ...json,
      ...{
        httpPort: process.env.PORT || json?.httpPort || DEFAULT_HTTP_PORT
      }
    })
  } catch (err) {
    Logger.warn('Failed to restore user defaults', err)
  }
})()

/*
Setup listeners for new workspaces
in order to remove any dangling
references
*/
;(function () {
  WorkspaceRegistry.getInstance().on('add', workspace => {
    const creationTimeStamp = Date.now()

    function conditionalUnload () {
      /*
      Make sure that we've given clients
      a timeframe to connect before
      terminating the workspace
      */
      if (Date.now() - creationTimeStamp < WORKSPACE_TEARDOWN_MIN_THRESHOLD_MS) {
        return
      }

      if (workspace?.state?.data?._connections?.length > 0) {
        return
      }

      WorkspaceRegistry.getInstance().delete(workspace.id)
      workspace.teardown()
    }

    workspace.on('cleanup', () => {
      if (platform.isElectron() && electron.isSuspended()) {
        return
      }

      if (
        platform.isElectron() &&
        electron.lastResumed() > Date.now() - WORKSPACE_RESUME_CLEANUP_DELAY_MS
      ) {
        return
      }

      conditionalUnload()
      workspace.cleanupSockets()
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
const server = app.listen(UserDefaults.data.httpPort, '0.0.0.0', () => {
  Logger.info('Listening on port', UserDefaults.data.httpPort)
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
    port: UserDefaults.data.httpPort,
    version: pkg.version,
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

/*
Setup a new window if running
in an electron context
*/
;(async function () {
  if (!platform.isElectron()) {
    return
  }
  await electron.isReady()
  electron.initWindow(`http://localhost:${UserDefaults.data.httpPort}`)
})()

/*
Write the user defaults-state to disk
before the process exits
*/
;(function () {
  function writeUserDeafults () {
    Logger.debug('Writing user defaults to disk')
    fs.writeFileSync(paths.userDefaults, JSON.stringify(UserDefaults.data))
  }

  if (platform.isElectron()) {
    electron.app.once('will-quit', () => {
      writeUserDeafults()
    })
  } else {
    process.on('exit', () => writeUserDeafults())

    process.on('SIGTERM', () => {
      writeUserDeafults()
      process.exit(0)
    })

    process.on('SIGINT', () => {
      writeUserDeafults()
      process.exit(0)
    })
  }
})()

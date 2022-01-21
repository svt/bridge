/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const fs = require('fs')
const url = require('url')
const path = require('path')
const assert = require('assert')

const express = require('express')
const app = express()

const WorkspaceRegistry = require('./lib/WorkspaceRegistry')
const Workspace = require('./lib/Workspace')

const HttpError = require('./lib/error/HttpError')
const Logger = require('./lib/Logger')
const State = require('./lib/State')

const template = require('./app/template')

const electron = require('./lib/electron')

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

const ASSETS = require('./assets.json')
const PORT = process.env.PORT || 3000

app.disable('x-powered-by')
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'dist')))

/**
 * A reference to
 * the main http server
 * @type { HttpError.Server }
 */
const server = app.listen(PORT, '0.0.0.0', () => {
  Logger.info('Listening on port', PORT)
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

app.get('/new', (req, res, next) => {
  const workspace = new Workspace()
  WorkspaceRegistry.getInstance().add(workspace)
  res.redirect(`/${workspace.id}`)
})

app.use('/:workspace', (req, res, next) => {
  const id = req.params.workspace
  const workspace = WorkspaceRegistry.getInstance().get(id)

  if (!workspace) {
    const err = new HttpError('Workspace not found', 'ERR_WORKSPACE_NOT_FOUND', 404)
    return next(err)
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
Fallback to responding
with the client app
*/
app.get('*', (req, res, next) => {
  res.send(template({
    env: process.env.NODE_ENV,
    port: PORT,
    version: process.env.npm_package_version,
    workspace: req.workspace?.id,
    socketHost: `ws://127.0.0.1:${PORT}`,
    hostProtocol: process.env.HOST_PROTOCOL
  }, ASSETS.assets))
})

app.use((err, req, res, next) => {
  let _err = err
  Logger.error(_err)

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
  if (!electron.isCompatible()) return
  await electron.isReady()

  electron.initWindow('http://localhost:3000')
})()

/*
A dummy function for setting up
the interface during development
*/
;(function () {
  State.getInstance().apply({
    children: {
      a: {
        component: 'bridge.internals.grid',
        data: {
          children: {
            b: {
              component: 'bridge.internals.selection'
            },
            c: {
              component: 'bridge.plugin.missing'
            }
          }
        }
      }
    }
  })
})()

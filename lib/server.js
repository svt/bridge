// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const url = require('node:url')
const path = require('node:path')

const express = require('express')

const UserDefaults = require('./UserDefaults')
const WorkspaceRegistry = require('./WorkspaceRegistry')

const HttpError = require('./error/HttpError')

const template = require('../app/template')

const network = require('./network')
const platform = require('./platform')
const apiRoutes = require('./routes')
const config = require('./config')

const assets = require('../assets.json')
const pkg = require('../package.json')

const Logger = require('./Logger')
const logger = new Logger({ name: 'server' })

/*
These constants depend on the UserDefaults-state and
MUST be declared AFTER initialization as UserDefaults
would otherwise be blank
*/
const HTTP_PORT = UserDefaults.data.httpPort || config.defaults.HTTP_PORT
const HTTP_BIND_ADDR = UserDefaults.data.httpBindToAll ? '0.0.0.0' : 'localhost'

const app = express()

app.disable('x-powered-by')
app.use(express.static(path.join(__dirname, '../public')))
app.use(express.static(path.join(__dirname, '../dist')))

/**
 * A reference to
 * the main http server
 * @type { HttpError.Server }
 */
const server = app.listen(HTTP_PORT, HTTP_BIND_ADDR, () => {
  logger.info('Listening on port', HTTP_PORT)
})

;(function () {
  if (process.env.NODE_ENV === 'development') {
    /*
     Allow any origin to access the API
     if running in development mode
     */
    logger.info('Access-Control-Allow-Origin=*')
    logger.info('Access-Control-Allow-Headers=*')
    logger.info('Access-Control-Allow-Methods=*')
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
    logger.warn('Closed websocket connection to a non existing workspace')
    sock.end()
    return
  }

  workspace.socket.upgrade(req, sock, head)
})

app.get('/workspaces/new', (req, res, next) => {
  const id = WorkspaceRegistry.getInstance().create()
  res.redirect(`/workspaces/${id}`)
})

/*
Keep workspaces under /workspaces/:id
in order to not trigger their creation
when going to paths such as /favicon.ico
*/
function handleWorkspaceWidget (req, res, next) {
  const widgetId = req.params.widget

  if (typeof widgetId !== 'string') {
    return next(new Error('Invalid widgetId, must be a string'))
  }

  req.widget = {
    id: widgetId
  }
  return handleWorkspace(req, res, next)
}

/*
Keep workspaces under /workspaces/:id
in order to not trigger their creation
when going to paths such as /favicon.ico
*/
function handleWorkspace (req, res, next) {
  const id = req.params.workspace
  const workspace = WorkspaceRegistry.getInstance().get(id)

  if (!workspace) {
    return next(new HttpError('Workspace not found', 'ERR_WORKSPACE_NOT_FOUND', 404))
  }

  /*
  Set a reference to the Workspace
  to the request object for further
  requests to make use of
  */
  req.workspace = workspace
  next()
}

app.use('/workspaces/:workspace/widgets/:widget', handleWorkspaceWidget)
app.use('/workspaces/:workspace', handleWorkspace)

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
    widget: req.widget?.id,
    hostProtocol: process.env.HOST_PROTOCOL
  }, assets.assets))
})

app.use((err, req, res, next) => {
  let _err = err
  logger.error(_err.message)
  logger.raw(_err)

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

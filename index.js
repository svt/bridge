/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const fs = require('fs')
const path = require('path')
const assert = require('assert')

const express = require('express')
const app = express()

const PluginLoader = require('./lib/plugin/PluginLoader')
const ContextStore = require('./lib/plugin/ContextStore')
const Logger = require('./lib/Logger')

const paths = require('./lib/paths')
const utils = require('./lib/utils')
const socket = require('./lib/socket')
const template = require('./app/template')

const State = require('./lib/State')

const HttpError = require('./lib/error/HttpError')

const electron = require('./lib/electron')

/**
 * Verify that an assets file is
 * created before running the app,
 * hashes are used in order to eliminate
 * caching issues
 */
;(function () {
  const assetsExist = fs.existsSync('./assets.json')
  assert(
    assetsExist,
    'No assets file found, the project must be built before it\'s run: \'npm build\''
  )
})()

const ASSETS = require('./assets.json')
const PORT = process.env.PORT || 3000

/**
 * Load internal plugins
 */
;(async function () {
  const loader = new PluginLoader({ path: paths.internalPlugins })
  const plugins = await loader.list()

  for (const plugin of plugins) {
    loader.load(plugin._path)
  }
})()

/**
 * Create the application data directory
 * if it doesn't already exist and load
 * external plugins
 */
;(async function () {
  await utils.createDirectoryRecursively(paths.appData)
  await utils.createDirectoryRecursively(paths.plugins)

  const loader = new PluginLoader({ path: paths.plugins })
  const plugins = await loader.list()

  for (const plugin of plugins) {
    loader.load(plugin._path)
  }
})()

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
  if (req.url !== '/api/v1/ws') return
  socket.handleUpgrade(req, sock, head)
})

/*
Serve static files
registered by plugins
*/
app.get('/plugins/:bundle/static/:file', (req, res, next) => {
  const ctx = ContextStore.getInstance().get(req.params.bundle)
  const file = ctx?._files[req.params.file]

  try {
    const rs = fs.createReadStream(file)
    rs.pipe(res)
  } catch (_) {
    const err = new HttpError('Bundle or file not found', 'ERR_BUNDLE_OR_FILE_NOT_FOUND', 404)
    return next(err)
  }
})

app.get('/plugins/:bundle/components/:component', (req, res, next) => {
  const ctx = ContextStore.getInstance().get(req.params.bundle)
  const component = ctx._components[req.params.component]

  if (!component) {
    const err = new HttpError('Component not found', 'ERR_COMPONENT_NOT_FOUND', 404)
    return next(err)
  }

  if (typeof component.getHtml !== 'function') {
    const err = new HttpError('Component is missing the required getHTML function', 'ERR_INVALID_COMPONENT', 400)
    return next(err)
  }

  res
    .contentType('html')
    .send(component.getHtml())
})

/*
Fallback to responding
with the client app
*/
app.get('*', (req, res, next) => {
  /*
  Use the original host and protocol as base
  to ensure that assets are loaded from the
  correct host
  */
  const base = (function () {
    const host = req.get('X-SVT-App-Host')
    const proto = req.get('X-Forwarded-Proto')

    if (!host) return '/'
    return `${proto || 'http'}://${host}/`
  })()

  res.send(template({
    version: process.env.npm_package_version,
    env: process.env.NODE_ENV,
    app: req.state,
    base,
    apiHost: utils.stripTrailingSlash(base),
    analyticsId: process.env.ANALYTICS_ID,
    hostProtocol: process.env.HOST_PROTOCOL,
    socketHost: `ws://127.0.0.1:${PORT}`,
    port: PORT
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

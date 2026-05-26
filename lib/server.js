// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const path = require('node:path')

const UserDefaults = require('./UserDefaults')
const WorkspaceRegistry = require('./WorkspaceRegistry')
const StaticFileRegistry = require('./StaticFileRegistry')

const HttpError = require('./error/HttpError')

const template = require('../app/template')

const network = require('./network')
const platform = require('./platform')
const config = require('./config')

const assets = require('../assets.json')
const pkg = require('../package.json')

const random = require('./security/random')
const messageEncoder = require('../shared/messageEncoder')

const Logger = require('./Logger')
const logger = new Logger({ name: 'server' })

const HTTP_PORT = UserDefaults.data.httpPort || config.defaults.HTTP_PORT
const HTTP_BIND_ADDR = UserDefaults.data.httpBindToAll ? '0.0.0.0' : config.defaults.HTTP_ADDR

const PUBLIC_DIR = path.join(__dirname, '../public')
const DIST_DIR = path.join(__dirname, '../dist')

const DEV_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*'
}

function isDev () {
  return process.env.NODE_ENV === 'development'
}

function withDevHeaders (response) {
  if (!isDev()) return response
  for (const [k, v] of Object.entries(DEV_CORS_HEADERS)) {
    response.headers.set(k, v)
  }
  return response
}

function jsonError (httpError) {
  return new Response(
    JSON.stringify({
      name: httpError.name,
      code: httpError.code,
      description: httpError.message
    }),
    {
      status: httpError.status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

function logRequest (req) {
  if (!logger.debug) return
  const { method } = req
  const { pathname } = new URL(req.url)
  logger.debug(`${method} ${pathname}`)
}

/**
 * Render the SPA shell with a fresh CSP nonce.
 *
 * @param { { workspaceId?: string, widgetId?: string } } params
 */
function renderApp ({ workspaceId, widgetId } = {}) {
  const nonce = random.string(16)
  const html = template({
    env: process.env.NODE_ENV,
    port: HTTP_PORT,
    address: HTTP_BIND_ADDR === '0.0.0.0' && platform.isElectrobun()
      ? network.getFirstIPv4Address()
      : 'localhost',
    version: pkg.version,
    platform: process.platform,
    workspace: workspaceId,
    widget: widgetId,
    hostProtocol: process.env.HOST_PROTOCOL
  }, assets.assets, nonce)

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `script-src 'self' 'nonce-${nonce}'`
    }
  })
}

/**
 * Try to serve a static asset from the public/ or dist/ directories.
 * Returns a Response or null if no file matched.
 */
async function tryStatic (pathname) {
  /* Block path traversal before joining. */
  if (pathname.includes('..')) return null

  for (const root of [PUBLIC_DIR, DIST_DIR]) {
    const absolute = path.join(root, pathname)
    if (!absolute.startsWith(root)) continue

    const file = Bun.file(absolute)
    if (await file.exists()) {
      return new Response(file)
    }
  }
  return null
}

/**
 * Coerce a thrown error into a Response.
 */
function errorResponse (err) {
  logger.error(err.message)
  logger.raw(err)
  if (err instanceof HttpError) {
    if (!err.status || err.status === 500) {
      return jsonError(new HttpError('Internal server error', 'ERR_INTERNAL_SERVER_ERROR', 500))
    }
    return jsonError(err)
  }
  return jsonError(new HttpError('Internal server error', 'ERR_INTERNAL_SERVER_ERROR', 500))
}

/* ---------- WebSocket dispatch ---------- */

/*
Bun.serve has a single WebSocket handler set; we route each socket to
the appropriate Workspace by stashing the workspace id on ws.data at
upgrade time. The per-workspace logic still lives in
lib/workspace/WorkspaceSockets.js.
*/
const websocketHandlers = {
  open (ws) {
    const workspace = WorkspaceRegistry.getInstance().get(ws.data.workspaceId)
    if (!workspace) {
      logger.warn('Closed WebSocket connection to a non-existing workspace')
      ws.close()
      return
    }
    workspace.sockets.attach(ws, ws.data.reqId, ws.data.reqRefresh)
  },

  message (ws, data) {
    const workspace = WorkspaceRegistry.getInstance().get(ws.data.workspaceId)
    if (!workspace) return

    try {
      const raw = typeof data === 'string' ? data : data.toString()
      const json = JSON.parse(raw)
      const decoded = messageEncoder.decodeMessage(json)
      workspace.sockets.receive(ws, decoded)
    } catch (err) {
      logger.error('Unable to parse socket body', err)
    }
  },

  close (ws) {
    const workspace = WorkspaceRegistry.getInstance().get(ws.data.workspaceId)
    if (!workspace) return
    workspace.sockets.detach(ws)
  }
}

/* ---------- Boot ---------- */

const server = Bun.serve({
  port: HTTP_PORT,
  hostname: HTTP_BIND_ADDR,
  development: isDev(),
  websocket: websocketHandlers,

  routes: {
    '/': req => {
      logRequest(req)
      return withDevHeaders(Response.redirect('/workspaces/new', 302))
    },

    '/workspaces/new': req => {
      logRequest(req)
      const id = WorkspaceRegistry.getInstance().create()
      return withDevHeaders(Response.redirect(`/workspaces/${id}`, 302))
    },

    '/workspaces/:workspaceId': req => {
      logRequest(req)
      const workspace = WorkspaceRegistry.getInstance().get(req.params.workspaceId)
      if (!workspace) {
        return withDevHeaders(jsonError(new HttpError('Workspace not found', 'ERR_WORKSPACE_NOT_FOUND', 404)))
      }
      return withDevHeaders(renderApp({ workspaceId: workspace.id }))
    },

    '/workspaces/:workspaceId/widgets/:widgetId': req => {
      logRequest(req)
      const workspace = WorkspaceRegistry.getInstance().get(req.params.workspaceId)
      if (!workspace) {
        return withDevHeaders(jsonError(new HttpError('Workspace not found', 'ERR_WORKSPACE_NOT_FOUND', 404)))
      }
      return withDevHeaders(renderApp({ workspaceId: workspace.id, widgetId: req.params.widgetId }))
    },

    '/named/:name': req => {
      logRequest(req)
      const all = WorkspaceRegistry.getInstance().list()
      const workspace = all.find(w => w.state.data.url === req.params.name)
      if (!workspace) {
        return withDevHeaders(jsonError(new HttpError('Workspace not found', 'ERR_WORKSPACE_NOT_FOUND', 404)))
      }
      return withDevHeaders(Response.redirect(`/workspaces/${workspace.id}`, 302))
    },

    '/api/v1/serve/:id': req => {
      logRequest(req)
      const stream = StaticFileRegistry.getInstance().createReadStream(req.params.id)
      if (!stream) {
        return withDevHeaders(jsonError(new HttpError('File not found', 'ERR_NOT_FOUND', 404)))
      }
      /* Node ReadableStream is consumable directly by Response in Bun. */
      return withDevHeaders(new Response(stream))
    },

    '/api/v1/ws': (req, server) => {
      logRequest(req)
      const url = new URL(req.url)
      const workspaceId = url.searchParams.get('workspace')
      if (!workspaceId) {
        return new Response('Missing workspace id', { status: 400 })
      }
      const upgraded = server.upgrade(req, {
        data: {
          workspaceId,
          reqId: url.searchParams.get('id'),
          reqRefresh: url.searchParams.get('refresh')
        }
      })
      if (upgraded) return undefined
      return new Response('Expected WebSocket upgrade', { status: 426 })
    }
  },

  async fetch (req) {
    logRequest(req)
    try {
      const url = new URL(req.url)
      const staticResp = await tryStatic(url.pathname)
      if (staticResp) return withDevHeaders(staticResp)
      /* Fallback for unknown paths — serve the SPA shell. */
      return withDevHeaders(renderApp())
    } catch (err) {
      return withDevHeaders(errorResponse(err))
    }
  },

  error (err) {
    return errorResponse(err)
  }
})

logger.info('Listening on', `${server.hostname}:${server.port}`)

if (isDev()) {
  logger.info('Access-Control-Allow-Origin=*')
  logger.info('Access-Control-Allow-Headers=*')
  logger.info('Access-Control-Allow-Methods=*')
}

module.exports = server

const http = require('node:http')

const Router = require('obj-router')

const HTTPError = require('../error/HttpError')

const DIBase = require('../../shared/DIBase')
const DIController = require('../../shared/DIController')

const Logger = require('../Logger')
const logger = new Logger({ name: 'HTTPServer' })

const DEFAULT_ROUTES = {
  '/': {
    get: req => ({ status: 200, body: 'Hello World' })
  }
}

class HTTPServer extends DIBase {
  #server
  #router

  constructor (props, routes = DEFAULT_ROUTES) {
    super(props)
    this.#setup(routes)
  }

  #setup (routes) {
    this.#router = new Router(routes)
    this.#server = http.createServer(this.#handleRequest.bind(this))
  }

  async #handleRequest (req, res) {
    const _req = {
      method: req.method,
      url: req.url
    }

    if (!this.#router.resolve(_req.url, _req)) {
      return this.#respondWithError(res,
        new HTTPError('Resource not found', 'ERR_NOT_FOUND', 404)
      )
    }

    try {
      // const response = await this.#router.execute(_req.url, _req)
      // this.#respond.call(this, res, response)
    } catch (err) {
      this.#respondWithError(res, err)
    }
  }

  #respondWithError (res, err) {
    const responseObject = {
      status: 500,
      body: {
        description: 'Internal server error',
        code: 'ERR_INTERNAL_SERVER_ERROR'
      }
    }

    if (err instanceof HTTPError) {
      responseObject.status = err.status
      responseObject.body.description = err.message
      responseObject.body.code = err.code
    }

    this.#respond(res, responseObject)
  }

  #respond (res, responseObject) {
    const response = {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: ''
    }

    if (typeof responseObject.status === 'number') {
      response.status = responseObject.status
    }

    for (const [key, value] of Object.entries(responseObject?.headers || {})) {
      response.headers[key] = value
    }

    if (responseObject.body) {
      response.body = responseObject.body
    }

    res.writeHead(response.status, response.headers)
    res.end(response.body)
  }

  listen (port) {
    this.#server.listen(port, err => {
      if (err) {
        logger.error('Listen failed on port', port, err)
        return
      }
      logger.info('Listening on port', port)
    })
  }
}

DIController.main.register('HTTPServer', HTTPServer)

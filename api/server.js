// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../shared/DIController')

class Server {
  #props

  /**
   * Uris for
   * static assets
   *
   * @type {{
   *  STYLE_RESET: String
   * }}
   */
  get uris () {
    return Object.freeze({
      STYLE_RESET: '/bridge.bundle.css'
    })
  }

  constructor (props) {
    this.#props = props
  }

  /**
   * Serve a static file
   * through the web server
   * @param { String } filePath An absolute path to the file to serve
   * @returns { Promise.<String> } A path to the file as served by the web server
   */
  serveFile (filePath) {
    return this.#props.Commands.executeCommand('server.serveFile', filePath)
      .then(hash => `/api/v1/serve/${hash}`)
  }

  /**
   * Serve a string as a static file
   * through the web server
   * @param { String } str A string to serve as a file
   * @returns { Promise.<String> } A path to the file as served by the web server
   */
  serveString (str) {
    return this.#props.Commands.executeCommand('server.serveString', str)
      .then(hash => `/api/v1/serve/${hash}`)
  }

  /**
   * Stop serving a file through
   * the web server by its id
   * @param { String } id
   * @returns { Promise.<Boolean> }
   */
  unserve (id) {
    return this.#props.Commands.executeCommand('server.unserve', id)
  }
}

DIController.main.register('Server', Server, [
  'Commands'
])

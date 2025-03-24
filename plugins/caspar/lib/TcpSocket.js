// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const net = require('net')
const EventEmitter = require('events')

const TcpSocketError = require('./error/TcpSocketError')

const KEEPALIVE_DELAY_MS = 1000 * 60 * 10

class TcpSocket extends EventEmitter {
  static readyState = Object.freeze({
    open: 'open',
    opening: 'opening',
    readOnly: 'readOnly',
    writeOnly: 'writeOnly'
  })

  /**
   * Get a temporary socket
   * to the specified host
   * and port
   *
   * The socket will be disconnected
   * once the function has completetd
   *
   * @param { String } host
   * @param { Number } port
   * @param { Function.<Promise.<void>> } fn
   */
  static async temp (host, port, fn) {
    const socket = new TcpSocket()
    try {
      await socket.connect(host, port)

      const res = await fn(socket)
      socket.teardown()
      return res
    } catch (e) {
      return Promise.reject(e)
    }
  }

  /**
   * Get a reference to
   * the raw socket if
   * connected
   * @type { net.Socket | undefined }
   */
  get socket () {
    return this._socket
  }

  /**
   * Get the socket's current state
   * @type { 'open' | 'opening' | 'readOnly' | 'writeOnly' | undefined }
   */
  get readyState () {
    return this._socket?.readyState
  }

  /**
   * Connect to the specified
   * host and port
   *
   * You'll need to disconnect
   * if the socket is already
   * connected before connecting
   * again
   *
   * @param { String } host
   * @param { Number } port
   * @returns { Promise.<net.Socket | void> }
   */
  async connect (host, port) {
    if (this._socket) {
      this.teardown()
    }
    return new Promise((resolve, reject) => {
      this._socket = net.createConnection(port, host, err => {
        if (err) {
          this._socket = undefined
          return reject(err)
        }

        resolve(this._socket)
      })

      this._socket.setKeepAlive(true, KEEPALIVE_DELAY_MS)

      this._socket.on('timeout', () => {
        this.emit('error', new TcpSocketError('Connection timeout', 'ERR_CONNECTION_TIMEOUT'))
        this.teardown()
        reject(new TcpSocketError('Connection timeout'))
      })

      this._socket.on('connect', () => {
        this.emit('connect')
      })

      this._socket.on('close', () => {
        this.emit('close')
        this.teardown()
      })

      this._socket.on('error', err => {
        this.emit('error', err)
        this.teardown()
      })

      this._socket.on('data', chunk => {
        this.emit('data', chunk)
      })
    })
  }

  /**
   * Teardown the socket,
   * will remove all listeners
   * and set the underlying socket
   * to undefined
   */
  teardown () {
    if (!this._socket) {
      return
    }
    this._socket.removeAllListeners()
    this._socket.end()
    this._socket.destroy()

    this._socket = undefined

    this.removeAllListeners()
  }

  /**
   * Send some over the
   * connected socket
   * @param { String | Buffer } data
   * @returns { Promise.<void> }
   */
  async send (data) {
    if (!this.socket) {
      /**
       * @todo
       * Throw a relevant error
       */
      return
    }
    this.socket.write(data)
  }
}
module.exports = TcpSocket

// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const net = require('net')

class TcpSocket {
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
    await socket.connect(host, port)

    const res = await fn(socket)
    socket.destroy()

    return res
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
      this.destroy()
    }
    return new Promise((resolve, reject) => {
      this._socket = net.createConnection(port, host, err => {
        if (err) {
          this._socket = undefined
          return reject(err)
        }
        resolve(this._socket)
      })
    })
  }

  /**
   * Destroy the socket,
   * will remove all listeners
   * and set the underlying socket
   * to undefined
   */
  destroy () {
    if (!this._socket) {
      return
    }
    this._socket.removeAllListeners()
    this._socket.destroy()

    this._socket = undefined
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

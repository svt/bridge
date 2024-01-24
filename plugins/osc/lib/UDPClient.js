// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const dgram = require('node:dgram')

class UDPClient {
  /**
   * Create a temporary UDP
   * socket and send a message
   *
   * The socket will be closed
   * when the message is sent
   * @param { String } address
   * @param { Number } port
   * @param { Buffer } message
   * @returns { Promise.<void | Error> }
   */
  static send (address, port, message) {
    const socket = dgram.createSocket('udp4')
    return new Promise((resolve, reject) => {
      socket.send(message, port, address, err => {
        socket.close()
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }
}

module.exports = UDPClient

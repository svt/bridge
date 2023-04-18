// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const TcpSocket = require('./TcpSocket')

class Caspar {
  constructor (host, port) {
    this._host = host
    this._port = port
  }

  parseResponse (rows) {
    const [status, action] = rows.shift().split(' ')
    const out = {
      status,
      action,
      data: rows
    }
    return out
  }

  send (amcp) {
    return TcpSocket.temp(this._host, this._port, async socket => {
      return new Promise(resolve => {
        const rows = []
        socket.socket.on('data', data => {
          const str = data.toString()
          const parts = str.split('\r\n')
          rows.push(...parts)

          if (parts[parts.length - 1] === '') {
            resolve(this.parseResponse(rows))
          }
        })
        socket.send(`${amcp}\r\n`)
      })
    })
  }
}
module.exports = Caspar

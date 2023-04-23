// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Caspar = require('./Caspar')

class CasparManager {
  constructor () {
    /**
     * @private
     * @type { Map.<String, Caspar> }
     */
    this._index = new Map()
  }

  add (id, caspar) {
    this._index.set(id, caspar)
  }

  remove (id) {
    this._index.delete(id)
  }
  
  get (id) {
    return this._index.get(id)
  }

  diff (servers = []) {
    const serverIndex = {}
    for (const server of servers) {
      serverIndex[server.id] = server
    }

    /*
    Remove all servers that are
    no longer supposed to exist
    */
    Array.from(this._index.entries())
      .filter(([id]) => !serverIndex[id])
      .forEach(([id]) => {
        this.remove(id)
      })

    for (const server of servers) {
      if (this._index.has(server.id)) {
        /*
        Find the existing caspar instance
        and connect it to the new host and port
        */
        const caspar = this._index.get(server.id)
        caspar.connect(server.host, server.port)
      } else {
        /*
        Create a new caspar server
        and connect to the provided
        host and port
        */
        const caspar = new Caspar(server.host, server.port, {
          reconnect: true
        })
        this.add(server.id, caspar)
      }
    }

    console.log('Servers', Array.from(this._index.values()))
  }
}
module.exports = CasparManager

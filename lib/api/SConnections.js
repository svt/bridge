const uuid = require('uuid')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const ApiError = require('../error/ApiError')

/**
 * @typedef {{
 *  heartbeat: number
 * }} Connection
 *
 * @typedef { 'render' | 'main' } ConnectionType
 */

const CONNECTION_ROLE = Object.freeze({
  satellite: 0,
  main: 1
})

const CONNECTION_TYPE = Object.freeze({
  render: 'render',
  main: 'main'
})

const CONNECTION_TIMEOUT_KEEPALIVE_MS = 20000

class SConnections extends DIBase {
  get type () {
    return CONNECTION_TYPE
  }

  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerCommand('connections.registerConnection', this.registerConnection.bind(this))
    this.props.SCommands.registerCommand('connections.removeConnection', this.removeConnection.bind(this))
    this.props.SCommands.registerCommand('connections.heartbeat', this.heartbeat.bind(this))
  }

  /**
   * Get a connection by its id
   * @param { string } id
   * @returns { Connection | undefined }
   */
  getConnection (id) {
    const connections = this.props.SState.getState('_connections')
    return connections?.[id]
  }

  getAllConnections () {
    return Object.entries(this.props.SState.getState('_connections'))
      .map(([id, val]) => {
        return {
          ...(val || {}),
          id
        }
      })
  }

  /**
   * Get the connection count
   * @param { ConnectionType | undefined }
   * @returns { number }
   */
  getConnectionCount (type) {
    let connections = Object.values(this.props.SState.getState('_connections'))

    /*
    If a type is specified,
    filter only those connections
    */
    if (type) {
      connections = connections.filter(conn => conn?.type === type)
    }

    return connections.length
  }

  /**
   * Get a new UUID
   * for a connection
   * that is guaranteed
   * to be unique
   * @returns { string }
   */
  getNewId () {
    const proposal = uuid.v4()
    const exists = this.getConnection(proposal)
    if (exists) {
      return this.getNewId()
    }
    return proposal
  }

  /**
   * Register a new connection
   * @param { ConnectionType } type
   * @returns { string }
   */
  registerConnection (type) {
    const id = this.getNewId()
    const count = this.getConnectionCount(type)

    const newConnectionObj = {
      type,
      heartbeat: Date.now()
    }

    /*
    Make this connection the main
    connection if it's the only one,
    and if it's of the render type
    */
    if (type === CONNECTION_TYPE.render && count === 0) {
      newConnectionObj.role = CONNECTION_ROLE.main
    }

    this.props.SState.applyState({
      _connections: {
        [id]: newConnectionObj
      }
    })

    return id
  }

  heartbeat (id) {
    if (!this.getConnection(id)) {
      throw new ApiError('Connection for heartbeat not found', 'ERR_API_CONNECTIONS_CONNECTION_NOT_FOUND')
    }
    this.props.SState.applyState({
      _connections: {
        [id]: { heartbeat: Date.now() }
      }
    })
  }

  removeConnection (id) {
    if (!this.getConnection(id)) {
      throw new ApiError('Connection requested to be removed not found', 'ERR_API_CONNECTIONS_CONNECTION_NOT_FOUND')
    }
    this.props.SState.applyState({
      _connections: {
        [id]: { $delete: true }
      }
    })
    this.props.SEvents.emit('connections.remove', id)
    this.props.SCommands.removeAllByOwner(id)
  }

  removeStaleConnections () {
    const now = Date.now()
    const connections = this.getAllConnections()

    for (const conn of connections) {
      const id = conn.id

      if (conn?.type === CONNECTION_TYPE.main) {
        continue
      }

      /*
      Set the heartbeat of any
      connections missing it,
      if it's inactive it will be
      invalidated in a later pass
      */
      if (conn.heartbeat == null) {
        this.state.apply({
          _connections: {
            [id]: { heartbeat: now }
          }
        })
        continue
      }

      /*
      Remove any connections with
      an expired heartbeat
      */
      if (now - conn?.heartbeat < CONNECTION_TIMEOUT_KEEPALIVE_MS) {
        continue
      }

      if (conn?.isPersistent) {
        continue
      }

      /*
      Remove the socket, will trigger
      the remove event of the handler
      */
      this.removeConnection(id)
    }
  }
}

DIController.main.register('SConnections', SConnections, [
  'SCommands',
  'SEvents',
  'SState'
])

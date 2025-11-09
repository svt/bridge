const uuid = require('uuid')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const ApiError = require('../error/ApiError')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Client api' })

/**
 * @typedef {{
 *  role: 'main' | 'satellite'
 * }} Connection
 */

const CONNECTION_ROLE = Object.freeze({
  satellite: 0,
  main: 1
})

class SClient extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('client.registerClient', this.registerClient.bind(this))
    this.props.SCommands.registerAsyncCommand('client.removeClient', this.removeClient.bind(this))
  }

  /**
   * Get a connection by its id
   * @param { string } id
   * @returns { Connection | undefined }
   */
  getClient (id) {
    const connections = this.props.SState.getState('_connections')
    return connections?.[id]
  }

  getAllClients () {
    return Object.entries(this.props.SState.getState('_connections'))
      .map(([id, val]) => {
        return {
          ...(val || {}),
          id
        }
      })
  }

  /**
   * Get the client count
   * @returns { number }
   */
  getClientCount () {
    return Object
      .values(this.props.SState.getState('_connections'))
      .length
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
    const exists = this.getClient(proposal)
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
  registerClient () {
    const id = this.getNewId()
    logger.debug('Registering new client', id)

    const count = this.getClientCount()

    const newConnectionObj = {
      role: CONNECTION_ROLE.satellite
    }

    /*
    Make this connection the main
    connection if it's the only one,
    and if it's of the render type
    */
    if (count === 0) {
      newConnectionObj.role = CONNECTION_ROLE.main
    }

    this.props.SState.applyState({
      _connections: {
        [id]: newConnectionObj
      }
    })

    return id
  }

  removeClient (id) {
    logger.debug('Removing client', id)
    if (!this.getClient(id)) {
      throw new ApiError('Client requested to be removed not found', 'ERR_API_CONNECTIONS_CONNECTION_NOT_FOUND')
    }
    this.props.SState.applyState({
      _connections: {
        [id]: { $delete: true }
      }
    })
    return true
  }
}

DIController.main.register('SClient', SClient, [
  'SCommands',
  'SEvents',
  'SState'
])

/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const uuid = require('uuid')

const State = require('./State')
const PluginLoader = require('./plugin/PluginLoader')
const SocketHandler = require('./SocketHandler')

const Logger = require('./Logger')
const logger = new Logger({ name: 'Workspace' })

const paths = require('./paths')
const api = require('./api')

const SOCKET_KEEPALIVE_TIMEOUT_MS = 20000
const SOCKET_CLEANUP_INTERVAL_MS = 1000

class Workspace {
  /**
   * The application's unique id
   * as a uuid v4 string
   * @type { String }
   */
  get id () {
    return this._id
  }

  constructor () {
    this._setup()
  }

  async setupPlugins () {
    const plugins = await this.plugins.list()

    for (const plugin of plugins) {
      this.plugins.load(plugin._path)
    }

    this.state.apply({
      _plugins: plugins
    })
  }

  /**
   * @private
   */
  _setup () {
    /**
     * @private
     */
    this._id = uuid.v4()
    logger.debug('Created workspace', this._id)

    this.state = new State()
    this.socket = new SocketHandler(this.state)
    this.plugins = new PluginLoader({ paths: [paths.internalPlugins, paths.plugins], workspace: this })
    this.api = api.factory(this)

    /**
     * @todo
     * This should be triggered through commands in the API
     * rather than manually here - please remove before flight
     */
    this.setupPlugins()

    /*
    Set a task to clean up
    dead sockets every second
    */
    /**
     * @private
     */
    this.cleanupTask = setInterval(
      () => this._cleanupSockets(),
      SOCKET_CLEANUP_INTERVAL_MS
    )

    /*
    Set initial values
    for the state
    */
    this.state.data.connections = []

    /*
    Listen for changes to the state
    and send it to sockets accordingly
    */
    this.state.on('change', (state, opts) => {
      this.socket.broadcast({ type: 'state', data: state })
    })

    this.socket.on('remove', id => {
      this._removeConnectionFromState(id)
    })
  }

  /**
   * Unload the application
   */
  teardown () {
    logger.debug('Tearing down workspace', this.id)
    clearInterval(this.cleanupTask)
    this.state.teardown()
    this.socket.teardown()
    this.plugins.teardown()
  }

  /**
   * @private
   *
   * Remove a connection from the state
   * @param { String } id
   */
  _removeConnectionFromState (id) {
    const index = this.state.data.connections.indexOf(id)
    if (index >= 0) {
      this.state.data.connections.splice(index, 1)
    }
    delete this.state.data[id]
  }

  /**
   * @private
   *
   * Clean up all sockets with a heartbeat
   * value with a delta over a certain threshold
   */
  _cleanupSockets () {
    const now = Date.now()
    const state = this.state.data

    Object.keys(state)
      .filter(key => uuid.validate(key))
      .forEach(id => {
        /*
          Set the heartbeat of any
          connections missing it in
          order to clean up the state
          */
        if (state[id].heartbeat == null) {
          this.state.apply({ [id]: { heartbeat: now } })
          return
        }

        /*
          Remove any connections with
          an expired heartbeat
          */
        if (now - state[id]?.heartbeat < SOCKET_KEEPALIVE_TIMEOUT_MS) {
          return
        }

        /*
        Remove the socket, will trigger
        the remove event of the handler
        */
        this.socket.remove(id)
      })
  }
}
module.exports = Workspace

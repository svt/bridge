// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const uuid = require('uuid')

const EventEmitter = require('events')

const DIController = require('../shared/DIController')

const State = require('./State')
const PluginLoader = require('./plugin/PluginLoader')
const SocketHandler = require('./SocketHandler')

const Logger = require('./Logger')
const logger = new Logger({ name: 'Workspace' })

const UserDefaults = require('./UserDefaults')

const paths = require('./paths')

const template = require('./template.json')

const SOCKET_KEEPALIVE_TIMEOUT_MS = 20000
const SOCKET_CLEANUP_INTERVAL_MS = 1000

/**
 * @class Workspace
 *
 * @typedef {{
 *  heartbeat: Number,
 *  isPersistent: Boolean,
 *  isEditingLayout: Boolean
 * }} Connection
 */
class Workspace extends EventEmitter {
  /**
   * The application's unique id
   * as a uuid v4 string
   * @type { String }
   */
  get id () {
    return this._id
  }

  constructor (initialState) {
    super()
    this._setup(initialState)
  }

  async setupPlugins () {
    const plugins = await this.plugins.list()

    for (const plugin of plugins) {
      this.plugins.load(plugin._path)
    }

    /*
    Create an array of describing objects
    for the plugins in order to not keep
    whole manifests in the state
    */
    const pluginDescriptions = plugins.map(plugin => ({
      name: plugin.name,
      version: plugin.version
    }))

    this.state.apply({
      _plugins: pluginDescriptions
    })
  }

  /**
   * @private
   */
  _setup (initialState) {
    /**
     * @private
     */
    this._id = uuid.v4()
    logger.debug('Initialized workspace', this._id)

    this.state = new State(initialState)
    this.socket = new SocketHandler(this.state)
    this.plugins = new PluginLoader({ paths: [paths.internalPlugins, paths.plugins], workspace: this })

    this.api = DIController.main.instantiate('SAPI', {
      Workspace: this
    })

    /**
     * @todo
     * This should be triggered through commands in the API
     * rather than manually here - please remove before flight
     */
    this.setupPlugins()

    /**
     * @private
     * A task cleaning up dead
     * sockets at a regular
     * interval
     */
    this.cleanupTask = setInterval(
      () => this.emit('cleanup'),
      SOCKET_CLEANUP_INTERVAL_MS
    )

    /*
    Set initial values
    for the state
    */
    this.state.data._connections = {}

    this._onUserDefaultsChange = this._onUserDefaultsChange.bind(this)
    UserDefaults.on('change', this._onUserDefaultsChange)

    /*
    Listen for changes to the state
    and send it to sockets accordingly
    */
    this.state.on('change', (set, transparent) => {
      this.api.events.emit('state.change', set, this.state.revision, transparent)

      /*
      Whenever the _userDefaults object changes,
      apply them to the user defaults-state as well
      */
      if (set._userDefaults && transparent?.sender !== 'UserDefaults') {
        UserDefaults.apply(set._userDefaults, { workspace: this.id })
      }
    })

    this.socket.on('remove', id => {
      this._removeConnectionFromState(id)
    })

    this.socket.on('message', (id, socket, msg) => {
      if (msg.command === 'commands.registerCommand') {
        /**
         * msg.args will be an array of arguments
         * where the first argument is the identifier
         * of the command to call.
         *
         * See the implementation of
         * the original registerCommand
         * function
         *
         * @see /lib/api/index.js
         */
        this.api.commands.registerCommand(msg.args[0], (...args) => {
          /*
          Look up the actual socket rather than sending the response
          to the socket object provided as a parameter as
          it may have reconnected and become invalidated
          */
          this.socket.getSocket(id)?.send(JSON.stringify({
            command: msg.args[0],
            args
          }))
        }, id)
        return
      }

      if (msg.command === 'events.triggerCommand') {
        this.api.commands.executeCommand(msg.command, ...(msg.args || []), id)
        return
      }

      this.api.commands.executeCommand(msg.command, ...(msg.args || []))
    })

    /*
    Initialize the state
    */
    this.state.apply({
      id: this.id,
      _userDefaults: UserDefaults.data
    })

    /*
    Apply a template if no initial
    state is provided
    */
    if (!initialState) {
      this.state.apply(template)
    }
  }

  /**
   * Teardown the workspace
   */
  teardown () {
    logger.debug('Tearing down workspace', this.id)
    clearInterval(this.cleanupTask)

    this.socket.teardown()

    this.state.teardown()
    this.plugins.teardown()

    UserDefaults.removeListener('change', this._onUserDefaultsChange)
    this.removeAllListeners('cleanup')
  }

  /**
   * @private
   *
   * Triggered whenever the user defaults-state
   * is changed in order to update the workspace-state
   * accordingly
   * @param { any } state
   */
  _onUserDefaultsChange (state) {
    this.state.apply({
      _userDefaults: state
    }, {
      sender: 'UserDefaults'
    })
  }

  /**
   * @private
   *
   * Remove a connection from the state
   * @param { String } id
   */
  _removeConnectionFromState (id) {
    this.state.apply({
      _connections: {
        [id]: { $delete: true }
      }
    })
  }

  /**
   * List all connections currently
   * connected to this workspace
   * @returns { Connection[] }
   */
  getConnections () {
    return Object.entries(this.state.data?._connections || {})
      .map(([id, connection]) => {
        return {
          ...connection,
          id
        }
      })
  }

  /**
   * Clean up sockets that should
   * be removed in order to prevent
   * zombie connections using up the
   * state
   */
  cleanupSockets () {
    const now = Date.now()
    const stateData = this.state.data
    const connections = Object.keys(stateData._connections)

    for (const id of connections) {
      /*
      Set the heartbeat of any
      connections missing it,
      if it's inactive it will be
      invalidated in a later pass
      */
      if (stateData._connections[id].heartbeat == null) {
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
      if (now - stateData._connections[id]?.heartbeat < SOCKET_KEEPALIVE_TIMEOUT_MS) {
        continue
      }

      if (stateData._connections[id].isPersistent) {
        continue
      }

      /*
      Remove the socket, will trigger
      the remove event of the handler
      */
      this.socket.removeSocket(id)
      this.api.commands.removeAllByOwner(id)
    }
  }
}
module.exports = Workspace

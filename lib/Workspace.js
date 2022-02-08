/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const uuid = require('uuid')

const EventEmitter = require('events')

const State = require('./State')
const PluginLoader = require('./plugin/PluginLoader')
const SocketHandler = require('./SocketHandler')

const Logger = require('./Logger')
const logger = new Logger({ name: 'Workspace' })

const paths = require('./paths')
const api = require('./api')

const SOCKET_KEEPALIVE_TIMEOUT_MS = 20000
const SOCKET_CLEANUP_INTERVAL_MS = 1000

class Workspace extends EventEmitter {
  /**
   * The application's unique id
   * as a uuid v4 string
   * @type { String }
   */
  get id () {
    return this._id
  }

  constructor () {
    super()
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
      () => {
        this._cleanupSockets()
        this.emit('cleanup')
      },
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
      this.api.events.emit('state.change', state)
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
          socket.send(JSON.stringify({
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

    this.state.apply({
      children: {
        root: {
          component: 'bridge.internals.tabs',
          children: {
            1: {
              title: 'Welcome',
              component: 'bridge.internals.grid',
              layout: {
                getting_started: { x: 0, y: 0, w: 12, h: 6 }
              },
              children: {
                getting_started: {
                  component: 'bridge.plugins.welcome'
                }
              }
            },
            2: {
              title: 'Second',
              component: 'bridge.internals.grid',
              layout: {
                time: { x: 0, y: 0, w: 4, h: 2 },
                latency: { x: 4, y: 0, w: 4, h: 2 }
              },
              children: {
                time: {
                  component: 'bridge.plugins.clock.time'
                },
                latency: {
                  component: 'bridge.plugins.clock.latency'
                }
              }
            }
          }
        }
      }
    })
  }

  /**
   * Teardown the workspace
   */
  teardown () {
    logger.debug('Tearing down workspace', this.id)
    clearInterval(this.cleanupTask)
    this.state.teardown()
    this.socket.teardown()
    this.plugins.teardown()

    this.removeAllListeners('cleanup')
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
        this.api.commands.removeAllByOwner(id)
      })
  }
}
module.exports = Workspace

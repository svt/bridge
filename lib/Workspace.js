/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const uuid = require('uuid')

const State = require('./State')
const CommandBus = require('./CommandBus')
const PluginLoader = require('./plugin/PluginLoader')
const ContextStore = require('./plugin/ContextStore')
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
    console.log('Setting up plugins')
    const plugins = await this.plugins.list()
    this.plugins.load(plugins[0]._path)
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
    this.commands = new CommandBus()
    this.plugins = new PluginLoader({ paths: [paths.internalPlugins, paths.plugins], workspace: this })
    this.contexts = new ContextStore()
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
    this.cleanupTask = setInterval(
      () => this.cleanupSockets(),
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
      this.removeConnectionFromState(id)
    })

    this.state.apply({
      children: {
        _: {
          component: 'bridge.internals.tabs',
          children: {
            'Tab 1': {
              component: 'bridge.internals.grid',
              layout: {
                b: { x: 0, y: 0, w: 5, h: 1 },
                c: { x: 0, y: 1, w: 5, h: 2 }
              },
              children: {
                b: {
                  component: 'bridge.internals.selection'
                },
                c: {
                  component: 'bridge.plugin.missing'
                }
              }
            },
            'Tab 2': {
              component: 'bridge.internals.grid',
              layout: {
                b1: { x: 2, y: 0, w: 5, h: 1 },
                c1: { x: 4, y: 3, w: 5, h: 2 }
              },
              children: {
                b1: {
                  component: 'bridge.internals.selection'
                },
                c1: {
                  component: 'bridge.plugin.missing'
                }
              }
            }
          }
        }
      }
    })
  }

  /**
   * Unload the application
   */
  unload () {
    clearInterval(this.cleanupTask)

    /**
     * @todo
     * Clean up handlers on unload
     */
  }

  /**
   * @private
   *
   * Remove a connection from the state
   * @param { String } id
   */
  removeConnectionFromState (id) {
    const index = this.state.data.connections.indexOf(id)
    if (index >= 0) {
      this.state.data.connections.splice(index, 1)
    }
    delete this.state.data[id]
  }

  /**
   * Clean up all sockets with a heartbeat
   * value with a delta over a certain threshold
   */
  cleanupSockets () {
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

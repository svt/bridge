// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const uuid = require('uuid')

const EventEmitter = require('events')

const DIController = require('../../shared/DIController')

const SavedState = require('../state/SavedState')
const PluginLoader = require('../plugin/PluginLoader')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Workspace' })

const UserDefaults = require('../UserDefaults')

const paths = require('../paths')

const template = require('../template.json')

const SOCKET_CLEANUP_INTERVAL_MS = 1000

/**
 * @class Workspace
 *
 * @typedef {{
 *  heartbeat: Number,
 *  isEditingLayout: Boolean
 * }} Connection
 */
class Workspace extends EventEmitter {
  #id

  /**
   * The application's unique id
   * as a uuid v4 string
   * @type { String }
   */
  get id () {
    return this.#id
  }

  get crypto () {
    return this.props.WorkspaceCrypto
  }

  get sockets () {
    return this.props.WorkspaceSockets
  }

  constructor (props) {
    super()
    this.props = props
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

  async setup (initialState) {
    /**
     * @private
     */
    this.#id = uuid.v4()
    logger.debug('Initialized workspace', this.#id)

    this.state = new SavedState(initialState)

    this.api = DIController.main.instantiate('SAPI', {
      Workspace: this
    })

    this.sockets.setWorkspace(this)
    this.plugins = new PluginLoader({ paths: [paths.internalPlugins, paths.plugins], workspace: this })

    /**
     * @todo
     * This should be triggered through
     * commands in the API rather than
     * manually here
     */
    this.setupPlugins()

    /**
     * @private
     * A task cleaning up dead
     * sockets at a regular
     * interval
     */
    this.cleanupTask = setInterval(
      () => {
        this.emit('cleanup')
      },
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

    /*
    Initialize the state
    */
    this.state.apply({
      _id: this.id,
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

    this.state.teardown()
    this.sockets.teardown()
    this.plugins.teardown()

    UserDefaults.removeListener('change', this._onUserDefaultsChange)
    this.removeAllListeners('cleanup')

    this.props.WindowStore.closeAllWindows()
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
}

DIController.main.register('Workspace', Workspace, [
  'WorkspaceSockets',
  'WorkspaceCrypto',
  'WindowStore'
])

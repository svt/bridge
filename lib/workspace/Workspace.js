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
const DEFAULT_AUTO_SAVE_INTERVAL_MS = 30000

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

  #saveFn
  #autoSaveTask

  set saveFn (newValue) {
    if (typeof newValue !== 'function') {
      throw new Error('The save function must be a callable function')
    }
    this.#saveFn = newValue
  }

  get saveFn () {
    return this.#saveFn
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

    this.#setupAutoSave()
  }

  save () {
    if (!this.saveFn) {
      throw new Error('No save function set, unable to save workspace')
    }
    this.saveFn()
  }

  /**
   * @private
   * This function should only ever be called once to
   * set up listeners for the auto save mechanism
   */
  #setupAutoSave () {
    this.state.on('change', (set, transparent) => {
      /*
      Whenever the enable auto save flag changes,
      tear down and restart the auto save loop
      */
      if (set?.core?.internals?.enableAutoSave !== undefined) {
        this.#stopAutoSave()
        if (set?.core?.internals?.enableAutoSave) {
          this.#startAutoSave()
        }
      }

      /*
      Whenever the autoSaveInterval flag changes, restart
      the auto save interval to use the new duration
      */
      if (set?.core?.internals?.autoSaveInterval) {
        this.#startAutoSave()
      }
    })

    /*
    Start auto save immediately if the flag
    is set to true within the state
    */
    if (this.state.data?.core?.internals?.enableAutoSave) {
      this.#startAutoSave()
    }
  }

  #getAutoSaveInterval () {
    const newValueStr = this.state.data?.core?.internals?.autoSaveInterval
    const newValueInt = parseInt(newValueStr)

    if (typeof newValueInt === 'number' && !Number.isNaN(newValueInt)) {
      return newValueInt * 1000
    }
    return DEFAULT_AUTO_SAVE_INTERVAL_MS
  }

  /**
   * This function is automatically managed by #setupAutoSave
   * and should not be called by any other function
   */
  #startAutoSave () {
    if (this.#autoSaveTask) {
      this.#stopAutoSave()
    }
    logger.debug('Saving at', this.#getAutoSaveInterval())
    this.#autoSaveTask = setInterval(() => {
      try {
        this.save()
      } catch {
        logger.warn('Auto save failed')
      }
    }, this.#getAutoSaveInterval())
  }

  /**
   * Stop the auto
   * save mechanism
   */
  #stopAutoSave () {
    if (!this.#autoSaveTask) {
      return
    }
    clearInterval(this.#autoSaveTask)
  }

  /**
   * Teardown the workspace
   */
  teardown () {
    logger.debug('Tearing down workspace', this.id)
    clearInterval(this.cleanupTask)

    this.#stopAutoSave()

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

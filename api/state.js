// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const merge = require('../shared/merge')

const Cache = require('./classes/Cache')
const DIController = require('../shared/DIController')

const CACHE_MAX_ENTRIES = 10

class State {
  #props

  #cache = new Cache(CACHE_MAX_ENTRIES)

  /**
   * Keep a local
   * copy of the state
   * @type { State }
   */
  #state

  /**
   * The state's current
   * revision number,
   * this is used to ensure
   * that the state is kept
   * up-to-date
   *
   * Please note that this
   * value only will be updated
   * if there are listeners for
   * state changes attached by
   * the current process
   *
   * @type { Number }
   */
  #revision = 0

  constructor (props) {
    this.#props = props
    this.#setup()
  }

  #setup () {
    /*
    Intercept the state.change event
    to always include the full calculated
    state
    */
    this.#props.Events.intercept('state.change', async (set, remoteRevision, transparent) => {
      this.#revision += 1

      /*
      Make sure the revision numbers match, and if not,
      update the local state from the remote state
      */
      if (this.#revision !== remoteRevision) {
        const newState = await this.getRemoteState()
        this.#revision = newState._revision
        this.#state = newState
      } else {
        this.applyLocally(set)
      }

      return [this.#state, set]
    })
  }

  /**
   * Get the local revision
   * @returns { Number }
   */
  getLocalRevision () {
    return this.#revision
  }

  /**
   * Get the current local
   * copy of the state
   * @returns { Object }
   */
  getLocalState () {
    return this.#state
  }

  /**
   * Get the full remote state
   * @returns { Promise.<any> }
   *//**
   * Get a part of the remote state
   * specified by a dot notated path
   * @param { String } path
   * @returns { Promise.<any> }
   */
  getRemoteState (path) {
    return this.#props.Commands.executeCommand('state.get', path)
  }

  /**
   * Apply state changes to
   * the local copy of the state
   * @param { Object[] } set An array of objects to set
   *//**
   * Apply a single change to
   * the local copy of the state
   * @param { Object } set An object to set
   */
  applyLocally (set) {
    if (Array.isArray(set)) {
      for (const change of set) {
        this.#state = merge.deep(this.#state, change)
      }
    } else {
      this.#state = merge.deep(this.#state, set)
    }
  }

  /**
   * Create a new object by expanding the path
   * and set the provided value
   * @param { string } path
   * @param { any } value
   * @param { string | undefined } delimiter
   * @returns { any }
   */
  #expandObjectPath (path, value, delimiter = '.') {
    const parts = path.split(delimiter)

    const out = {}
    let pointer = out

    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]
      if (i === parts.length - 1) {
        pointer[key] = value
      } else {
        pointer[key] = {}
        pointer = pointer[key]
      }
    }

    return out
  }

  /**
   * Apply some data to the state,
   * most often this function shouldn't
   * be called directly - there's probably
   * a command for what you want to do
   * @param { object } set Data to apply to the state
   *//**
   * Apply some data to the state,
   * most often this function shouldn't
   * be called directly - there's probably
   * a command for what you want to do
   * @param { object[] } set An array of data objects to
   *                         apply to the state in order
   *//**
   * Apply some data to the state,
   * most often this function shouldn't
   * be called directly - there's probably
   * a command for what you want to do
   * @param { string } path A dot-path to which the value will be applied
   * @param { object } set A value to apply
   */
  apply (arg0, arg1) {
    let set = arg0

    /*
    If the function received a path and a value,
    expand create an object that can be set directly
    */
    if (typeof arg0 === 'string' && arg1) {
      set = this.#expandObjectPath(arg0, arg1)
    }

    this.#props.Commands.executeRawCommand('state.apply', set)
  }

  /**
   * Get the full current state
   * @returns { Promise.<State> }
   *//**
   * Get part of the current state
   * specified by a dot-notated path
   * @param { String } path
   * @returns { Promise.<State> }
   */
  async get (path) {
    if (!path) {
      const newState = await this.getRemoteState()
      this.#revision = newState._revision
      this.#state = newState
      return this.#state
    } else {
      /*
      If we can expect the revision to be updated,
      use the caching layer to bundle calls together
      */
      if (this.#props.Events.hasRemoteHandler('state.change') && this.#revision !== 0) {
        return this.#cache.cache(`${path}::${this.#revision}`, () => this.getRemoteState(path))
      }
      return this.getRemoteState(path)
    }
  }
}

DIController.main.register('State', State, [
  'Events',
  'Commands'
])

// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  id: String,
 *  data: any
 * }} Item
 *
 * @typedef {{
 *  description: String
 * }} ItemIssue
 */

const objectPath = require('object-path')

const random = require('./random')

const MissingArgumentError = require('./error/MissingArgumentError')
const InvalidArgumentError = require('./error/InvalidArgumentError')

const Cache = require('./classes/Cache')
const DIController = require('../shared/DIController')

const CACHE_MAX_ENTRIES = 10

/**
 * Perform a deep clone
 * of an object
 * @param { any } obj An object to clone
 * @returns { any }
 */
function deepClone (obj) {
  if (typeof window !== 'undefined' && window.structuredClone) {
    return window.structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj))
}

class Items {
  #props

  #cache = new Cache(CACHE_MAX_ENTRIES)

  constructor (props) {
    this.#props = props
    this.#setup()
  }

  #setup () {
    /*
    Intercept the item.change event
    to always include the full item
    */
    this.#props.Events.intercept('item.change', async (itemId, set) => {
      return [itemId, await this.getItem(itemId), set]
    })
  }

  /**
   * Create a new id for an item
   * that is unique and doesn't
   * already exist
   *
   * It's kept short to be
   * easy to work with
   *
   * @returns { String }
   */
  createUniqueId () {
    let proposal
    while (!proposal || this.#props.State.getLocalState()?.items?.[proposal]) {
      proposal = random.string(4)
    }
    return proposal
  }

  /**
   * Create an item from of a specific
   * type and store it in the this.#props.State
   * @param { String } type A type identifier to create an item from
   * @param { any } data Optional data that should be set to the data property
   * @returns { Promise.<String> } A Promise resolving to the id of the created item
   */
  async createItem (type, data = {}) {
    const _type = await this.#props.Types.getType(type)
    if (!_type) {
      throw new InvalidArgumentError('Received an invalid value for the argument \'type\', no such type exist')
    }

    let _data = {}
    if (typeof data === 'object' && !Array.isArray(data)) {
      _data = data
    }

    const item = {
      id: this.createUniqueId(),
      type: _type.id,
      data: {}
    }

    /*
     * Set defaults for this type
     */
    for (const [key, def] of Object.entries(_type.properties)) {
      objectPath.set(item.data, key, def.default || undefined)
    }

    /*
     * Set data that was provided to this function
     */
    Object.assign(item.data, _data)

    this.applyItem(item.id, item, true)
    return item.id
  }

  /**
   * Apply changes to an
   * item in the this.#props.State
   *
   * @param { string } id The id of an item to update
   * @param { Item } set An item object to apply
   * @param { boolean } emitEvent Whether or not to emit the item.change event
   */
  async applyItem (id, set = {}, emitEvent = false) {
    if (typeof id !== 'string') {
      throw new MissingArgumentError('Invalid value for item id, must be a string')
    }

    if (typeof set !== 'object' || Array.isArray(set)) {
      throw new InvalidArgumentError('Argument \'item\' must be a valid object that\'s not an array')
    }

    this.#props.State.apply({
      items: {
        [id]: set
      }
    })

    if (emitEvent) {
      this.#props.Events.emit('item.change', id, set)
    }
  }

  /**
   * Apply changes to an
   * already existing item
   * in the this.#props.State
   *
   * This function checks if the
   * item exists before applying
   * the data
   *
   * @param { string } id The id of an item to update
   * @param { Item } set An item object to apply
   * @param { boolean } emitEvent Whether or not to emit the item.change event
   */
  async applyExistingItem (id, set = {}, emitEvent = false) {
    const itemExists = await this.itemExists(id)
    if (!itemExists) {
      return
    }
    await this.applyItem(id, set, emitEvent)
  }

  async itemExists (id) {
    if (typeof id !== 'string') {
      throw new MissingArgumentError('Invalid value for item id, must be a string')
    }

    const item = await this.getItem(id)
    if (!item) {
      throw new InvalidArgumentError('Invalid item id, item does not exist')
    }
    return true
  }

  /**
   * Get an item object by its id
   * @param { String } id The id for the item to get
   * @returns { Promise.<Item> }
   */
  getItem (id) {
    /*
    Use caching if it's safe to do so

    The cache key must depend on the local state revision
    in order to not get out of date, and that will only
    get updated if the this.#props.Client is listening for the
    'state.change' event
    */
    if (
      this.#props.Events.hasRemoteHandler('state.change') &&
      this.#props.State.getLocalRevision() !== 0
    ) {
      return this.#cache.cache(`${id}::${this.#props.State.getLocalRevision()}`, () => {
        return this.#props.Commands.executeCommand('items.getItem', id)
      })
    }
    return this.#props.Commands.executeCommand('items.getItem', id)
  }

  /**
   * Get the local representation of an item
   * @param { String } id The id of the item to get
   * @returns { Item }
   */
  getLocalItem (id) {
    const curState = this.#props.State.getLocalState()
    return curState?.items?.[id]
  }

  /**
   * Delete an item by its id
   *
   * Will trigger the
   * items.delete event
   *
   * @param { String } id
   */
  deleteItem (id) {
    this.deleteItems([id])
  }

  /**
   * Delete multiple
   * items by their ids
   *
   * Will trigger the
   * items.delete event
   *
   * @param { String[] } ids
   */
  async deleteItems (ids) {
    /*
    Make sure any deleted items
    are no longer selected if available
    in the current context
    */
    if (typeof this.#props.Client?.subtractSelection === 'function') {
      this.#props.client.selection.subtractSelection(ids)
    }
    return this.#props.Commands.executeCommand('items.deleteItems', ids)
  }

  /**
   * Populate any variable placeholders
   * in an item's properties - in place
   *
   * @param { any } item
   * @param { any } type
   * @param { any } values
   * @returns { any } The item with modified property values
   */
  populateVariablesMutable (item, type, values) {
    if (!item.data) {
      item.data = {}
    }

    for (const key of Object.keys(type.properties)) {
      if (!type.properties[key].allowsVariables) {
        continue
      }
      const currentValue = objectPath.get(item.data, key)

      if (currentValue != null) {
        objectPath.set(item.data, key, JSON.parse(this.#props.Variables.substituteInString(JSON.stringify(currentValue), values)))
      }
    }

    return item
  }

  /**
   * Play the item and emit
   * the 'playing' event`
   * @param { String } id
   */
  async playItem (id) {
    const item = await this.getItem(id)

    if (!item) {
      return
    }

    if (item?.data?.disabled) {
      return
    }

    const type = await this.#props.Types.getType(item.type)
    const vars = await this.#props.Variables.getAllVariables()
    const clone = this.populateVariablesMutable(deepClone(item), type, vars)

    const delay = parseInt(clone?.data?.delay)

    if (delay && !Number.isNaN(delay)) {
      this.#props.Commands.executeCommand('items.scheduleItem', clone, delay)
    } else {
      this.#props.Commands.executeCommand('items.playItem', clone)
    }
  }

  /**
   * Play the item and emit
   * the 'stop' event
   * @param { String } id
   */
  async stopItem (id) {
    const item = await this.getItem(id)

    if (!item) {
      return
    }

    if (item?.data?.disabled) {
      return
    }

    const type = await this.#props.Types.getType(item.type)
    const vars = await this.#props.Variables.getAllVariables()
    const clone = this.populateVariablesMutable(deepClone(item), type, vars)

    this.#props.Commands.executeCommand('items.stopItem', clone)
  }

  /**
   * Add or update an
   * issue by its id
   *
   * An issue indicates a problem with an item
   * and may be reflected in the interface
   *
   * @param { String } itemId
   * @param { String } issueId
   * @param { ItemIssue } issueSpec
   */
  async applyIssue (itemId, issueId, issueSpec) {
    if (typeof itemId !== 'string') {
      throw new MissingArgumentError('Invalid value for item id, must be a string')
    }

    if (typeof issueId !== 'string') {
      throw new MissingArgumentError('Invalid value for issue id, must be a string')
    }

    if (typeof issueSpec !== 'object' || Array.isArray(issueSpec)) {
      throw new InvalidArgumentError('Argument \'issueSpec\' must be a valid object that\'s not an array')
    }

    await this.applyExistingItem(itemId, {
      issues: {
        [issueId]: {
          ts: Date.now(),
          ...issueSpec
        }
      }
    }, false)
  }

  /**
   * Remove an issue by its
   * id from an item
   *
   * @param { String } itemId
   * @param { String } issueId
   */
  async removeIssue (itemId, issueId) {
    if (typeof itemId !== 'string') {
      throw new MissingArgumentError('Invalid value for item id, must be a string')
    }

    if (typeof issueId !== 'string') {
      throw new MissingArgumentError('Invalid value for issue id, must be a string')
    }

    this.applyExistingItem(itemId, {
      issues: {
        [issueId]: { $delete: true }
      }
    }, false)
  }

  /**
   * Render a value for an item by its id,
   * this will replace any variable placeholders
   *
   * @example
   *
   * Item {
   *  id: '1234',
   *  data: {
   *    name: '$(this.data.myValue)',
   *    myValue: 'Hello World'
   *  }
   * }
   *
   * renderValue('1234', 'data.name') -> 'Hello World'
   *
   * @param { String } itemId The id of the item
   * @param { String } path The path to the value to render
   * @returns { Promise.<String | any | undefined> }
   */
  async renderValue (itemId, path) {
    const item = await this.getItem(itemId)
    const currentValue = objectPath.get(item || {}, path)
    return this.#props.Variables.substituteInString(currentValue, undefined, { this: item })
  }
}

DIController.main.register('Items', Items, [
  'State',
  'Types',
  'Client',
  'Events',
  'Commands',
  'Variables'
])

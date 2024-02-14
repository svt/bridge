// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  host: String,
 *  port: Number
 * }} ConnectionDescription
 *
 * @typedef {{
 *  id: String?,
 *  name: String,
 *  host: String,
 *  port: Number
 * }} ServerDescription
 */

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const uuid = require('uuid')

const manifest = require('../package.json')
const paths = require('./paths')

const Caspar = require('./Caspar')
const AMCP = require('./AMCP')

const CasparManager = require('./CasparManager')
const casparManager = new CasparManager()

const Logger = require('../../../lib/Logger')
const logger = new Logger({ name: 'CasparPlugin' })

const Cache = require('./Cache')
const cache = new Cache()

const CommandError = require('./error/CommandError')

const SERVER_GROUPS = [
  {
    id: 'group:0',
    name: 'Group: Primary'
  },
  {
    id: 'group:1',
    name: 'Group: Secondary'
  }
]

/**
* Setup a server instance
* from an init-object,
* also adding references to
* it in the required parts
* of the state
* @param { ServerDescription } description
*/
async function setupServer (description) {
  if (!description.id) {
    return
  }

  const server = new Caspar({
    reconnect: true
  })

  server.on('status', newStatus => {
    bridge.state.apply({
      _tmp: {
        [manifest.name]: {
          servers: {
            [description.id]: {
              status: newStatus
            }
          }
        }
      }
    })
  })

  casparManager.add(description.id, server)

  if (description.host && description.port) {
    server.connect(description.host, description.port)
  }
}
exports.setupServer = setupServer

/**
 * Add a new server
 * from an init-object
 * @param { ServerDescription } description
 * @returns { Promise.<String> } A promise resolving
 *                               to the server's id
 */
async function addServer (description) {
  logger.debug('Adding server')

  /*
  Generate a new id for
  referencing the server
  */
  description.id = uuid.v4()

  await setupServer(description)

  const serverArray = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.servers`) || []
  if (serverArray.length > 0) {
    bridge.state.apply({
      plugins: {
        [manifest.name]: {
          servers: { $push: [description] }
        }
      }
    })
  } else {
    bridge.state.apply({
      plugins: {
        [manifest.name]: {
          servers: [description]
        }
      }
    })
  }

  return description.id
}
exports.addServer = addServer
bridge.commands.registerCommand('caspar.addServer', addServer)

/**
 * Update the state from
 * a new description
 * @param { String } serverId The id of the server to edit
 * @param { ServerDescription } description A new server init object
 *                                          to apply to the server
 */
async function editServer (serverId, description) {
  const server = casparManager.get(serverId)
  if (!server) {
    throw new Error('Server not found')
  }

  const serverArray = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.servers`) || []
  const newServerArray = [...serverArray]
    .map(server => {
      if (server.id !== serverId) {
        return server
      }
      return description
    })

  bridge.state.apply({
    plugins: {
      'bridge-plugin-caspar': {
        servers: { $replace: newServerArray }
      }
    }
  })
}
exports.editServer = editServer
bridge.commands.registerCommand('caspar.editServer', editServer)

/**
 * Get a list of all configured servers
 * @param { Boolean } groups Whether or not to include groups
 * @returns { Promise.<ServerDescription[]> }
 */
async function listServers (groups = false) {
  const servers = (await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.servers`)) || []
  return [
    ...(groups ? SERVER_GROUPS : []),
    ...servers
  ]
}
exports.listServers = listServers
bridge.commands.registerCommand('caspar.listServers', listServers)

/**
 * Reconnect a server using
 * a new connection init
 * @param { String } serverId The id of the server to reconnect
 * @param { ConnectionDescription } description An object describing the new connection
 */
async function connectServer (serverId, description) {
  const server = casparManager.get(serverId)
  if (!server) {
    return Promise.reject(new Error('Server not found'))
  }
  if (description.host && description.port) {
    server.connect(description.host, description.port)
  }
}
exports.connectServer = connectServer
bridge.commands.registerCommand('caspar.connectServer', connectServer)

/**
 * Remove a server by its id,
 * will also disconnect any
 * current connections
 * @param { String } serverId The id of the
 *                            server to remove
 */
async function removeServer (serverId) {
  const server = casparManager.get(serverId)
  if (!server) {
    return Promise.reject(new Error('Server not found'))
  }
  server.teardown()
  casparManager.remove(serverId)

  const serverArray = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.servers`) || []
  const newServerArray = [...serverArray]
    .filter(server => server.id !== serverId)
  bridge.state.apply([
    {
      _tmp: {
        [manifest.name]: {
          servers: {
            [serverId]: { $delete: true }
          }
        }
      }
    },
    {
      plugins: {
        'bridge-plugin-caspar': {
          servers: { $replace: newServerArray }
        }
      }
    }
  ])
}
exports.removeServer = removeServer
bridge.commands.registerCommand('caspar.removeServer', removeServer)

/**
 * Send a command to a connected server
 * and let the lib format the AMCP string
 *
 * @param { String } serverId The id of the server
 *                            to send the command to
 * @param { String } command The name of the command to send
 * @param { ...any } args Any arguments required by the command
 * @returns { CasparResponse }
 */
async function sendCommand (serverId, command, ...args) {
  if (AMCP[command] == null) {
    return Promise.reject(new Error('Command not found'))
  }
  return sendString(serverId, AMCP[command](...args))
}
exports.sendCommand = sendCommand
bridge.commands.registerCommand('caspar.sendCommand', sendCommand)

/**
 * Similar to 'command' although
 * with a caching layer, if available
 * a cached response will be returned
 * in place of a hot response
 *
 * @param { String } serverId The id of the server
 *                            to send the command to
 * @param { String } command The name of the command to send
 * @param { ...any } args Any arguments required by the command
 * @returns { CasparResponse }
 */
async function sendCachedCommand (serverId, command, ...args) {
  return cache.cache(JSON.stringify([serverId, command, args]), () => {
    return sendCommand(serverId, command, ...args)
  })
}
exports.sendCachedCommand = sendCachedCommand
bridge.commands.registerCommand('caspar.sendCachedCommand', sendCachedCommand)

/**
 * Send a string to a connected server
 * and receive the response asynchronously
 * @param { String } serverId The id of the connected server
 *                            to send the command to
 * @param { String } string An AMCP string to send
 * @returns { Promise.<CasparResponse> }
 */
async function sendString (serverId, string) {
  const server = casparManager.get(serverId)
  if (!server) {
    return Promise.reject(new Error('Server not found'))
  }
  return server.send(string)
}
exports.sendString = sendString
bridge.commands.registerCommand('caspar.sendString', sendString)

/**
 * Get an array of the server descriptors a group
 * @param { String } groupId
 * @returns { Promise.<ServerDescription[]> }
 *
 * @example
 * const servers = await listServersInGroup('group:0')
 */
async function listServersInGroup (groupId = '') {
  if (typeof groupId !== 'string') {
    throw new CommandError('Parameter groupId must be a string', 'ERR_BAD_PARAMETER')
  }

  const index = groupId.split(':')[1]
  if (index === undefined) {
    return []
  }

  const servers = await listServers()
  return servers.filter(server => server?.group === index)
}
exports.listServersInGroup = listServersInGroup
bridge.commands.registerCommand('caspar.listServersInGroup', listServersInGroup)

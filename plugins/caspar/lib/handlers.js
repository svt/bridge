// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../../api').Api }
 */
const bridge = require('bridge')

const manifest = require('../package.json')

const commands = require('./commands')

const Logger = require('../../../lib/Logger')
const logger = new Logger({ name: 'CasparPlugin' })

const PLAY_HANDLERS = {
  'bridge.caspar.clear': (serverId, item) => {
    return commands.sendCommand(serverId, 'clear', item?.data?.caspar)
  },
  'bridge.caspar.amcp': (serverId, item) => {
    return commands.sendString(serverId, item?.data?.caspar?.amcp)
  },
  'bridge.caspar.media': async (serverId, item) => {
    return commands.sendCommand(serverId, 'play', item?.data?.caspar?.target, item?.data?.caspar?.loop, 0, undefined, undefined, undefined, item?.data?.caspar)
  },
  'bridge.caspar.load': async (serverId, item) => {
    return commands.sendCommand(serverId, 'loadbg', item?.data?.caspar?.target, item?.data?.caspar?.loop, 0, undefined, undefined, item?.data?.caspar?.auto, item?.data?.caspar)
  },
  'bridge.caspar.template': (serverId, item) => {
    return commands.sendCommand(serverId, 'cgAdd', item?.data?.caspar?.target, getCleanTemplateDataString(item), true, item?.data?.caspar)
  },
  'bridge.caspar.template.update': (serverId, item) => {
    return commands.sendCommand(serverId, 'cgUpdate', getCleanTemplateDataString(item), item?.data?.caspar)
  },
  'bridge.caspar.opacity': (serverId, item) => {
    return commands.sendCommand(serverId, 'mixerOpacity', item?.data?.caspar?.opacity, item?.data?.caspar)
  },
  'bridge.caspar.volume': (serverId, item) => {
    return commands.sendCommand(serverId, 'mixerVolume', item?.data?.caspar?.volume, item?.data?.caspar)
  }
}

const STOP_HANDLERS = {
  'bridge.caspar.media': (serverId, item) => {
    return commands.sendCommand(serverId, 'stop', item?.data?.caspar)
  },
  'bridge.caspar.load': async (serverId, item) => {

  },
  'bridge.caspar.template': (serverId, item) => {
    return commands.sendCommand(serverId, 'cgStop', item?.data?.caspar)
  },
  'bridge.caspar.template.update': (serverId, item) => {
    return commands.sendCommand(serverId, 'cgStop', item?.data?.caspar)
  },
  'bridge.caspar.opacity': (serverId, item) => {
    return commands.sendCommand(serverId, 'mixerOpacity', '1.0', { ...(item?.data?.caspar || {}), transitionDuration: 0 })
  },
  'bridge.caspar.volume': (serverId, item) => {
    return commands.sendCommand(serverId, 'mixerVolume', '1.0', { ...(item?.data?.caspar || {}), transitionDuration: 0 })
  }
}

/**
 * Get an item's template data as a clean string,
 * that is without formatting such as linebreaks
 * which is just for the inspector
 * @param { Item } item
 * @returns { String }
 */
function getCleanTemplateDataString (item) {
  try {
    const dirty = item?.data?.caspar?.templateDataSource

    if (dirty == null) {
      return JSON.stringify({})
    }

    return JSON.stringify(JSON.parse(dirty))
  } catch (err) {
    logger.warn('Failed to clean template data')
    return JSON.stringify({})
  }
}

/**
 * Check whether Caspar is set
 * to be live or not
 * @returns { Promise.<Boolean> }
 */
async function checkIsLive () {
  const isLive = await bridge.state.get(`plugins.${manifest.name}.isLive`)
  if (isLive === false) {
    return false
  }
  return true
}

/*
Register a listener for the item.play event and
call the matching handler for the item type
*/
bridge.events.on('item.play', async item => {
  if (!(await checkIsLive())) {
    return
  }

  if (!PLAY_HANDLERS[item.type]) {
    return
  }

  /*
  Look up the server id to check if it's a group,
  in that case play the item for all servers
  in that group
  */
  const servers = await commands.listServersInGroup(item?.data?.caspar?.server)

  if (servers.length > 0) {
    for (const server of servers) {
      PLAY_HANDLERS[item.type]?.(server?.id, item)
        .catch(err => logger.warn(err.message))
    }
  } else {
    PLAY_HANDLERS[item.type]?.(item?.data?.caspar?.server, item)
      .catch(err => logger.warn(err.message))
  }
})

/*
Register a listener for the item.stop event and
call the matching handler for the item type
*/
bridge.events.on('item.stop', async item => {
  if (!(await checkIsLive())) {
    return
  }

  if (!STOP_HANDLERS[item.type]) {
    return
  }

  /*
  Look up the server id to check if it's a group,
  in that case stop the item for all servers
  in that group
  */
  const servers = await commands.listServersInGroup(item?.data?.caspar?.server)

  if (servers.length > 0) {
    for (const server of servers) {
      STOP_HANDLERS[item.type]?.(server?.id, item)
        .catch(err => logger.warn(err.message))
    }
  } else {
    STOP_HANDLERS[item.type]?.(item?.data?.caspar?.server, item)
      .catch(err => logger.warn(err.message))
  }
})

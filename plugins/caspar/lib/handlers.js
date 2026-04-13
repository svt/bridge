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

/**
 * @param { string | number | undefined } inPoint In milliseconds
 * @param { string | number | undefined } frameRate In fps
 * @returns { number | undefined }
 */
function calculateSeek (inPoint, frameRate) {
  if (inPoint == null || inPoint === '' || frameRate == null || frameRate === '') {
    return undefined
  }
  const fps = parseFloat(frameRate)
  const ip = parseFloat(inPoint)
  if (isNaN(fps) || isNaN(ip)) {
    return undefined
  }
  return Math.round((ip / 1000) * fps)
}

/**
 * @param { string | number | undefined } inPoint In milliseconds
 * @param { string | number | undefined } outPoint In milliseconds
 * @param { string | number | undefined } frameRate In fps
 * @returns { number | undefined }
 */
function calculateLength (inPoint, outPoint, frameRate) {
  if (outPoint == null || outPoint === '' || frameRate == null || frameRate === '') {
    return undefined
  }
  const fps = parseFloat(frameRate)
  const ip = parseFloat(inPoint) || 0
  const op = parseFloat(outPoint)
  if (isNaN(fps) || isNaN(op)) {
    return undefined
  }
  return Math.round(((op - ip) / 1000) * fps)
}

/**
 * A helper function to send the play and
 * loadbg commands as they share signature
 *
 * @param { string } serverId
 * @param { string } command
 * @param { Object } item
 * @param { boolean }
 */
function sendMediaCommand (serverId, command, item, auto) {
  const server = commands.getServer(serverId)
  if (!server) {
    logger.warn('Server not found')
    return
  }

  const channelId = item?.data?.caspar?.channel
  const channel = (server.channels || [])
    .find(channel => channel?.id === channelId)

  if (!channel) {
    logger.warn('Channel not found')
    return
  }

  const seek = calculateSeek(item?.data?.inPoint, channel.frameRate)
  const length = calculateLength(item?.data?.inPoint, item?.data?.outPoint, channel.frameRate)
  return commands.sendCommand(serverId, command, item?.data?.caspar?.target, item?.data?.caspar?.loop, seek, length, undefined, auto, item?.data?.caspar)
}

const PLAY_HANDLERS = {
  'bridge.caspar.clear': (serverId, item) => {
    return commands.sendCommand(serverId, 'clear', item?.data?.caspar)
  },
  'bridge.caspar.amcp': (serverId, item) => {
    return commands.sendString(serverId, item?.data?.caspar?.amcp)
  },
  'bridge.caspar.media': (serverId, item) => {
    return sendMediaCommand(serverId, 'play', item)
  },
  'bridge.caspar.image-scroller': async (serverId, item) => {
    return commands.sendCommand(serverId, 'playImageScroller', item?.data?.caspar?.target, item?.data?.caspar)
  },
  'bridge.caspar.load': (serverId, item) => {
    return sendMediaCommand(serverId, 'loadbg', item, item?.data?.caspar?.auto)
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
  },
  'bridge.caspar.html': (serverId, item) => {
    return commands.sendCommand(serverId, 'html', item?.data?.caspar?.url, item?.data?.caspar)
  },
  'bridge.caspar.transform': (serverId, item) => {
    return commands.sendCommand(serverId, 'mixerFill', item?.data?.caspar?.x, item?.data?.caspar?.y, item?.data?.caspar?.width, item?.data?.caspar?.height, item?.data?.caspar)
  },
  'bridge.caspar.snapshot': (serverId, item) => {
    return commands.sendCommand(serverId, 'print', item?.data?.caspar)
  }
}

const STOP_HANDLERS = {
  'bridge.caspar.media': (serverId, item) => {
    return commands.sendCommand(serverId, 'stop', item?.data?.caspar)
  },
  'bridge.caspar.image-scroller': (serverId, item) => {
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
  },
  'bridge.caspar.html': (serverId, item) => {
    return commands.sendCommand(serverId, 'stop', item?.data?.caspar)
  },
  'bridge.caspar.transform': (serverId, item) => {
    return commands.sendCommand(serverId, 'mixerFill', 0, 0, 1, 1, { ...(item?.data?.caspar || {}), transitionDuration: 0 })
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

/*
Handle the item.end event to keep indicating
that an item is looping, if it is looping

This will recursively schedule
the endItem function
*/
bridge.events.on('item.end', async coldItem => {
  if (!coldItem?.id) {
    return
  }

  const hotItem = await bridge.items.getItem(coldItem.id)
  if (!hotItem?.data?.caspar?.loop) {
    return
  }

  bridge.items.applyItem(hotItem.id, {
    didStartPlayingAt: Date.now()
  })

  const endDelay = Math.max(hotItem?.data?.duration || 0, 0)
  if (!Number.isNaN(endDelay)) {
    bridge.commands.executeCommand('scheduler.delay', `end:${hotItem.id}`, endDelay, 'items.endItem', coldItem)
  }
})

/*
 * Handle changes to item data by updating the item
 * with a parsed value of the same data in order for
 * variables to be able to utilize it
 */
bridge.events.on('item.change', (itemId, _, set) => {
  /*
   * Make sure that the apply operation actually
   * modifies the templateDataSource value
   */
  if (!set?.data?.caspar?.templateDataSource) {
    return
  }

  try {
    /*
     * Parse the data and
     * apply it to the item
     */
    const structuredData = JSON.parse(set?.data?.caspar?.templateDataSource)
    bridge.items.applyItem(itemId, {
      data: {
        caspar: {
          data: { $replace: structuredData }
        }
      }
    }, false)
  } catch (e) {
    logger.warn('Failed to apply structured data to item with error: ', e)
  }
})

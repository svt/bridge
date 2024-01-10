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
  'bridge.caspar.clear': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'clear', item?.data?.caspar)
  },
  'bridge.caspar.amcp': item => {
    return commands.sendString(item?.data?.caspar?.server, item?.data?.caspar?.amcp)
  },
  'bridge.caspar.media': async item => {
    await commands.sendCommand(item?.data?.caspar?.server, 'loadbg', item?.data?.caspar?.target, item?.data?.caspar?.loop, 0, undefined, undefined, undefined, item?.data?.caspar)
    return commands.sendCommand(item?.data?.caspar?.server, 'playLoaded', '', item?.data?.caspar)
  },
  'bridge.caspar.template': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'cgAdd', item?.data?.caspar?.target, item?.data?.caspar?.templateData, true, item?.data?.caspar)
  },
  'bridge.caspar.template.update': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'cgUpdate', item?.data?.caspar?.templateData, item?.data?.caspar)
  },
  'bridge.caspar.opacity': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'mixerOpacity', item?.data?.caspar?.opacity, item?.data?.caspar)
  }
}

const STOP_HANDLERS = {
  'bridge.caspar.media': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'stop', item?.data?.caspar)
  },
  'bridge.caspar.template': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'cgStop', item?.data?.caspar)
  },
  'bridge.caspar.template.update': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'cgStop', item?.data?.caspar)
  },
  'bridge.caspar.opacity': item => {
    return commands.sendCommand(item?.data?.caspar?.server, 'mixerOpacity', '1.0', { ...(item?.data?.caspar || {}), transitionDuration: 0 })
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

  PLAY_HANDLERS[item.type]?.(item)
    .catch(err => logger.warn(err.message))
})

/*
Register a listener for the item.stop event and
call the matching handler for the item type
*/
bridge.events.on('item.stop', async item => {
  if (!(await checkIsLive())) {
    return
  }

  STOP_HANDLERS[item.type]?.(item)
    .catch(err => logger.warn(err.message))
})

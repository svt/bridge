// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../../api').Api }
 */
const bridge = require('bridge')

const commands = require('./commands')

const Logger = require('../../../lib/Logger')
const logger = new Logger({ name: 'CasparPlugin' })

const PLAY_HANDLERS = {
  'bridge.caspar.clear': item => {
    return commands.sendCommand(item?.caspar?.server, 'clear', item?.data?.caspar)
  },
  'bridge.caspar.amcp': item => {
    return commands.sendString(item?.caspar?.server, item?.data?.caspar?.amcp)
  },
  'bridge.caspar.media': item => {
    return commands.sendCommand(item?.caspar?.server, 'play', item?.data?.caspar?.target, item?.data?.caspar)
  },
  'bridge.caspar.template': item => {
    return commands.sendCommand(item?.caspar?.server, 'cgAdd', item?.data?.caspar?.target, item?.data?.caspar?.templateData, true, item?.data?.caspar)
  }
}

const STOP_HANDLERS = {
  'bridge.caspar.media': item => {
    return commands.sendCommand(item?.caspar?.server, 'stop', item?.data?.caspar)
  },
  'bridge.caspar.template': item => {
    return commands.sendCommand(item?.caspar?.server, 'cgStop', item?.data?.caspar)
  }
}

/*
Register a listener for the item.play event and
call the matching handler for the item type
*/
bridge.events.on('item.play', item => {
  PLAY_HANDLERS[item.type]?.(item)
    .catch(err => logger.warn(err.message))
})

/*
Register a listener for the item.stop event and
call the matching handler for the item type
*/
bridge.events.on('item.stop', item => {
  STOP_HANDLERS[item.type]?.(item)
    .catch(err => logger.warn(err.message))
})

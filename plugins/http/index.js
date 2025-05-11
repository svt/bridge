/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'HTTPPlugin' })

const RequestManager = require('./lib/RequestManager')
const requestManager = new RequestManager({ fetchFunction: fetch })

/**
 * Get an object containing default headers for requests,
 * this includes Bridge's user agent string
 * @returns { Promise.<any> }
 */
async function getDefaultHeaders () {
  const version = await bridge.system.getVersion()
  return {
    'User-Agent': `Bridge/${version}`
  }
}

const PLAY_HANDLERS = {
  /*
  Make requests
  */
  'bridge.http.get': async item => {
    try {
      logger.debug('Making request:', item?.data?.http?.url)
      const headers = await getDefaultHeaders()
      await requestManager.makeRequestForItemWithId(item.id, item?.data?.http?.url, { method: 'GET', headers })

      /*
       * Announce to the user that
       * the request succeeded
       */
      bridge.messages.createSuccessMessage({
        text: 'HTTP: Request succeeded'
      })
    } catch (e) {
      logger.debug('Request failed:', e)

      /*
       * Announce to the user that
       * the request failed
       */
      bridge.messages.createWarningMessage({
        text: 'HTTP: Request failed'
      })
    }
  }
}

const STOP_HANDLERS = {
  /*
  Abort requests
  */
  'bridge.http.get': item => {
    requestManager.abortAllRequestsForItemId(item.id)
    logger.debug('Aborting all HTTP requests for item:', item.id)
  }
}

exports.activate = async () => {
  bridge.events.on('item.play', item => {
    PLAY_HANDLERS[item.type]?.(item)
  })

  bridge.events.on('item.stop', item => {
    STOP_HANDLERS[item.type]?.(item)
  })
}

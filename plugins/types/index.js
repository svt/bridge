// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

const types = require('./lib/types')
const utils = require('./lib/utils')

const GROUP_PLAY_MODES = {
  all: 0,
  first: 1
}

const PLAY_HANDLERS = [
  /*
  Trigger group children based
  on the group's play mode
  */
  {
    predicate: item => item.type === 'bridge.types.group',
    fn: item => {
      switch (parseInt(item?.data?.playMode)) {
        case GROUP_PLAY_MODES.first:
          if (item?.children?.[0]) {
            bridge.items.playItem(item?.children?.[0])
          }
          break
        case GROUP_PLAY_MODES.all:
        default:
          for (const child of (item?.children || [])) {
            bridge.items.playItem(child)
          }
      }
    }
  },

  /*
  Trigger a reference
  item's target
  */
  {
    predicate: (item, type) => item.type === 'bridge.types.reference' || type.ancestors.includes('bridge.types.reference'),
    fn: item => {
      if (!item?.data?.targetId) {
        return
      }

      switch (parseInt(item?.data?.playAction)) {
        case types.REFERENCE_ACTION.none:
          break
        case types.REFERENCE_ACTION.stop:
          bridge.items.stopItem(item?.data?.targetId)
          break
        case types.REFERENCE_ACTION.play:
        default:
          bridge.items.playItem(item?.data?.targetId)
          break
      }
    }
  }
]

const STOP_HANDLERS = [
  /*
  Trigger group children based
  on the group's play mode
  */
  {
    predicate: item => item.type === 'bridge.types.group',
    fn: item => {
      for (const child of (item?.children || [])) {
        bridge.items.stopItem(child)
      }
    }
  },

  /*
  Trigger a reference
  item's target
  */
  {
    predicate: (item, type) => item.type === 'bridge.types.reference' || type.ancestors.includes('bridge.types.reference'),
    fn: item => {
      if (!item?.data?.targetId) {
        return
      }

      switch (parseInt(item?.data?.stopAction)) {
        case types.REFERENCE_ACTION.none:
          break
        case types.REFERENCE_ACTION.play:
          bridge.items.playItem(item?.data?.targetId)
          break
        case types.REFERENCE_ACTION.stop:
        default:
          bridge.items.stopItem(item?.data?.targetId)
          break
      }
    }
  }
]

const ITEM_CHANGE_HANDLERS = [
  /*
  Warn the user if a reference is
  targeting one of its own ancestors
  */
  {
    predicate: (item, type) => item.type === 'bridge.types.reference' || type.ancestors.includes('bridge.types.reference'),
    fn: async item => {
      const isAncestor = await utils.isAncestor(item?.data?.targetId, item?.id)

      if (!isAncestor) {
        bridge.items.removeIssue(item?.id, 'types.rta')
        return
      }

      bridge.items.applyIssue(item?.id, 'types.rta', {
        description: 'Reference is targeting an ancestor, loops may occur'
      })
    }
  }
]

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Types</title>
        <base href="/" />
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="${cssPath}" />
        <script src="${jsPath}" defer></script>
        <script>
          window.PLUGIN = ${JSON.stringify(
            {
              name: manifest.name
            }
          )}
        </script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `
  return await bridge.server.serveString(html)
}

exports.activate = async () => {
  const htmlPath = await initWidget()

  types.init(htmlPath)

  function callHandlers (handlers, item, type) {
    for (const handler of handlers) {
      if (handler.predicate(item, type)) {
        handler.fn(item, type)
      }
    }
  }

  bridge.events.on('item.play', async item => {
    const type = await bridge.types.getType(item.type)
    callHandlers(PLAY_HANDLERS, item, type)
  })

  bridge.events.on('item.stop', async item => {
    const type = await bridge.types.getType(item.type)
    callHandlers(STOP_HANDLERS, item, type)
  })

  bridge.events.on('item.change', async item => {
    const type = await bridge.types.getType(item.type)
    callHandlers(ITEM_CHANGE_HANDLERS, item, type)
  })
}

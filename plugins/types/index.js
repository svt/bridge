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

const GROUP_PLAY_MODES = {
  all: 'Trigger all children at once'
}

const PLAY_HANDLERS = {
  /*
  Trigger group children based
  on the group's play mode
  */
  'bridge.types.group': item => {
    if (item?.data?.playMode === GROUP_PLAY_MODES.all) {
      for (const child of item.children) {
        bridge.items.playItem(child)
      }
    }
  },

  /*
  Trigger a reference
  item's target
  */
  'bridge.types.reference': item => {
    if (!item?.data?.targetId) {
      return
    }
    bridge.items.playItem(item?.data?.targetId)
  }
}

const STOP_HANDLERS = {
  /*
  Trigger group children based
  on the group's play mode
  */
  'bridge.types.group': item => {
    for (const child of item.children) {
      bridge.items.stopItem(child)
    }
  },

  /*
  Trigger a reference
  item's target
  */
  'bridge.types.reference': item => {
    if (!item?.data?.targetId) {
      return
    }
    bridge.items.stopItem(item?.data?.targetId)
  }
}

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

  bridge.events.on('item.play', item => {
    PLAY_HANDLERS[item.type]?.(item)
  })

  bridge.events.on('item.stop', item => {
    STOP_HANDLERS[item.type]?.(item)
  })
}

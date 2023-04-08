// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Rundown</title>
        <base href="/"></base>
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="${cssPath}" />
        <script src="${jsPath}" defer></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `

  const htmlPath = await bridge.server.serveString(html)
  bridge.widgets.registerWidget('bridge.plugins.rundown', 'Rundown', `${htmlPath}`)
}

/**
 * Initiate the default settings
 * if no settings are set
 */
async function initSettings () {
  if (await bridge.state.get(`plugins.${manifest.name}.settings`) !== undefined) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          display: {
            notes: true,
            type: true
          }
        }
      }
    }
  })
}

exports.activate = async () => {
  initWidget()
  initSettings()

  /**
   * Get the items of a rundown
   * by the rundown's id
   * @param { String } rundownId The id of the rundown to get items for
   * @returns { String[] }
   */
  async function getItems (rundownId) {
    return (await bridge.state.get(`items.${rundownId}.data.items`)) || []
  }

  bridge.commands.registerCommand('rundown.reorderItem', async (rundownId, itemId, newIndex) => {
    const items = await getItems(rundownId)

    if (items.length === 0) {
      return appendItem(rundownId, itemId)
    }

    const oldIndex = items.indexOf(itemId)
    const weightedNewIndex = oldIndex < newIndex && oldIndex > -1 ? newIndex - 1 : newIndex

    if (oldIndex === newIndex) {
      return
    }

    const patches = []

    /*
    Only remove the old index if it
    is in the current rundown
    */
    if (oldIndex !== -1) {
      patches.push({
        items: {
          [rundownId]: {
            data: {
              items: {
                [oldIndex]: { $delete: true }
              }
            }
          }
        }
      })
    }

    bridge.state.apply([
      ...patches,
      {
        items: {
          [rundownId]: {
            data: {
              items: { $insert: itemId, $index: Math.max(0, weightedNewIndex) }
            }
          }
        }
      }
    ])
  })

  bridge.commands.registerCommand('rundown.removeItem', async (rundownId, itemId) => {
    const items = await getItems(rundownId)
    const index = items.indexOf(itemId)

    if (index === -1) return

    bridge.state.apply({
      items: {
        [rundownId]: {
          data: {
            items: {
              [index]: { $delete: true }
            }
          }
        }
      }
    })
  })

  async function appendItem (rundownId, itemId) {
    const items = await getItems(rundownId)

    /*
    If there aren't already items in an array,
    make sure that the items-object is indeed
    an array, otherwise, append new items
    */
    if (items.length === 0) {
      bridge.state.apply({
        items: {
          [rundownId]: {
            data: {
              items: [itemId]
            }
          }
        }
      })
    } else {
      bridge.state.apply({
        items: {
          [rundownId]: {
            data: {
              items: { $push: [itemId] }
            }
          }
        }
      })
    }
  }
  bridge.commands.registerCommand('rundown.appendItem', appendItem)
}

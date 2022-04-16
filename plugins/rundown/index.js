// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

const PLUGIN_STATE_SCOPE = 'bridge-plugin-rundown'

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

exports.activate = async () => {
  initWidget()

  /**
   * Get the items of a rundown
   * by the rundown's id
   * @param { String } rundownId The id of the rundown to get items for
   * @returns { String[] }
   */
  async function getItems (rundownId) {
    return (await bridge.state.get(`plugins.${PLUGIN_STATE_SCOPE}.rundowns.${rundownId}.items`)) || []
  }

  bridge.commands.registerCommand('rundown.reorderItem', async (rundownId, itemId, newIndex) => {
    const items = await getItems(rundownId)
    const oldIndex = items.indexOf(itemId)
    const weightedNewIndex = oldIndex < newIndex ? newIndex - 1 : newIndex

    if (oldIndex === -1) return
    if (oldIndex === newIndex) return

    bridge.state.apply([
      {
        plugins: {
          [PLUGIN_STATE_SCOPE]: {
            rundowns: {
              [rundownId]: {
                items: {
                  [oldIndex]: { $delete: true }
                }
              }
            }
          }
        }
      }, {
        plugins: {
          [PLUGIN_STATE_SCOPE]: {
            rundowns: {
              [rundownId]: {
                items: { $insert: itemId, $index: weightedNewIndex }
              }
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

    /*
    Remove the id from
    the array of items
    */
    items.splice(index, 1)

    bridge.state.apply({
      plugins: {
        [PLUGIN_STATE_SCOPE]: {
          rundowns: {
            [rundownId]: {
              items: { $replace: items }
            }
          }
        }
      }
    })
  })

  bridge.commands.registerCommand('rundown.appendItem', (rundownId, itemId) => {
    bridge.state.apply({
      plugins: {
        [PLUGIN_STATE_SCOPE]: {
          rundowns: {
            [rundownId]: {
              items: [itemId]
            }
          }
        }
      }
    })
  })
}

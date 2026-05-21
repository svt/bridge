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
  first: 1,
  random: 2
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
        case GROUP_PLAY_MODES.random:
          ;(function () {
            const children = item?.children || []
            const index = Math.round(Math.random() * (children.length - 1))
            if (children[index]) {
              bridge.items.playItem(children[index])
            }
          })()
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
    fn: async item => {
      const targets = await getReferenceTargets(item)
      if (!targets) {
        return
      }

      switch (parseInt(item?.data?.playAction)) {
        case types.REFERENCE_ACTION.none:
          break
        case types.REFERENCE_ACTION.stop:
          for (const targetId of targets) {
            if (targetId === item?.id) {
              continue
            }
            bridge.items.stopItem(targetId)
          }
          break
        case types.REFERENCE_ACTION.play:
        default:
          for (const targetId of targets) {
            if (targetId === item?.id) {
              continue
            }
            bridge.items.playItem(targetId)
          }
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
    fn: async item => {
      const targets = await getReferenceTargets(item)
      if (!targets) {
        return
      }

      switch (parseInt(item?.data?.stopAction)) {
        case types.REFERENCE_ACTION.none:
          break
        case types.REFERENCE_ACTION.play:
          for (const targetId of targets) {
            if (targetId === item?.id) {
              continue
            }
            bridge.items.playItem(targetId)
          }
          break
        case types.REFERENCE_ACTION.stop:
        default:
          for (const targetId of targets) {
            if (targetId === item?.id) {
              continue
            }
            bridge.items.stopItem(targetId)
          }
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
    predicate: (item, type) => item.type === 'bridge.types.reference' || type?.ancestors?.includes('bridge.types.reference'),
    fn: async item => {
      const isExpectingId = parseInt(item?.data?.targetType) === types.REFERENCE_TARGET_TYPE.itemById
      if (!isExpectingId) {
        bridge.items.removeIssue(item?.id, 'types.reference-targeting-ancestor')
        bridge.items.removeIssue(item?.id, 'types.reference-targeting-itself')
        bridge.items.removeIssue(item?.id, 'types.reference-missing-target')
        return
      }

      const hasTarget = item?.data?.targetId && String(item.data.targetId).length === 4
      if (hasTarget) {
        bridge.items.removeIssue(item?.id, 'types.reference-missing-target')
      } else {
        bridge.items.applyIssue(item?.id, 'types.reference-missing-target', {
          description: 'This item requires a valid target'
        })
        return
      }

      const isTargetingItself = item?.data?.targetId === item?.id
      if (!isTargetingItself) {
        bridge.items.removeIssue(item?.id, 'types.reference-targeting-itself')
      } else {
        bridge.items.applyIssue(item?.id, 'types.reference-targeting-itself', {
          description: 'Item is targeting itself'
        })
        return
      }

      const isAncestor = await utils.isAncestor(item?.data?.targetId, item?.id)
      if (!isAncestor) {
        bridge.items.removeIssue(item?.id, 'types.reference-targeting-ancestor')
      } else {
        bridge.items.applyIssue(item?.id, 'types.reference-targeting-ancestor', {
          description: 'Item is targeting an ancestor, loops may occur'
        })
      }
    }
  }
]

const ITEM_DELETE_HANDLERS = [
  /*
  Delete all children
  if a group or collection
  is deleted
  */
  {
    predicate: (item, type) => item.type === 'bridge.types.group' || type.ancestors.includes('bridge.types.group') || type.ancestors.includes('bridge.types.collection'),
    fn: item => {
      const childIds = item?.children || []
      if (!Array.isArray(childIds)) {
        return
      }
      bridge.items.deleteItems(childIds)
    }
  }
]

const ABORT_HANDLERS = [
  /*
  Abort all children if
  a group is aborted
  */
  {
    predicate: (item, type) => item.type === 'bridge.types.group' || type.ancestors.includes('bridge.types.group') || type.ancestors.includes('bridge.types.collection'),
    fn: item => {
      for (const child of (item?.children || [])) {
        bridge.items.abortItem(child)
      }
    }
  },

  /*
  Abort target items of references
  */
  {
    predicate: (item, type) => item.type === 'bridge.types.reference' || type.ancestors.includes('bridge.types.reference'),
    fn: async item => {
      const targets = await getReferenceTargets(item)
      if (!targets) {
        return
      }

      for (const targetId of targets) {
        bridge.items.abortItem(targetId)
      }
    }
  }
]

/**
 * Get the target(s) for
 * the specified reference item
 * @param { any } referenceItem
 * @returns { Promise.<string[] | undefined> }
 */
async function getReferenceTargets (referenceItem) {
  switch (parseInt(referenceItem?.data?.targetType)) {
    case types.REFERENCE_TARGET_TYPE.selection:
      return bridge.client.getMainClientSelection()
    default:
      return [referenceItem?.data?.targetId]
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

  bridge.events.on('item.abort', async item => {
    const type = await bridge.types.getType(item.type)
    callHandlers(ABORT_HANDLERS, item, type)
  })

  bridge.events.on('item.change', async (_, item) => {
    if (!item) {
      return
    }
    const type = await bridge.types.getType(item?.type)
    callHandlers(ITEM_CHANGE_HANDLERS, item, type)
  })

  bridge.events.on('items.delete', async items => {
    for (const item of items) {
      const type = await bridge.types.getType(item.type)
      callHandlers(ITEM_DELETE_HANDLERS, item, type)
    }
  })
}

// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../../api').Api }
 */
const bridge = require('bridge')

const tinycolor = require('tinycolor2')

const XmlParser = require('./XmlParser')
const CommandError = require('./error/CommandError')

const commands = require('./commands')
const types = require('./types')

/*
The id of the rundown plugin's main rundown
*/
const MAIN_RUNDOWN_ID = 'RUNDOWN_ROOT'

const DEFAULT_GROUP_NAME = 'Imported rundown'
const IMPORT_GROUP_COLOR = '#000000'

const DEFAULT_FRAME_RATE = 25

/*
Enum values from the types plugin
*/
const GROUP_PLAY_MODE_FIRST = 1
const ON_END_PLAY_NEXT_SIBLING = 1

const ENTITIES = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': '\'', '&amp;': '&' }

/**
 * Get the text of a parsed leaf element
 * @param { any } value
 * @returns { string | undefined }
 */
function text (value) {
  if (typeof value !== 'string') {
    return undefined
  }
  return value.replace(/&(lt|gt|quot|apos|amp);/g, entity => ENTITIES[entity])
}

/**
 * The parser returns a single child as an
 * object and multiple children as an array
 * @param { any } value
 * @returns { any[] }
 */
function toArray (value) {
  if (value == null) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

function compact (obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined))
}

function lowerFirst (str) {
  return str ? str[0].toLowerCase() + str.slice(1) : undefined
}

function isTrue (value) {
  return text(value)?.toLowerCase() === 'true'
}

function indexOfEnum (list, value) {
  return Math.max(list.findIndex(entry => entry.toLowerCase() === text(value)?.toLowerCase()), 0)
}

/**
 * Convert a legacy color, either a name or rgba(r, g, b, a), to hex
 * @param { any } value
 * @returns { string | undefined } Undefined for transparent or unknown colors
 */
function parseColor (value) {
  const str = text(value)?.trim()
  if (!str || str.toLowerCase() === 'transparent') {
    return undefined
  }

  /*
  The legacy alpha is 0-255 and dropped
  as items have a solid color
  */
  const rgba = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  const color = tinycolor(rgba ? { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]) } : str)
  return color.isValid() ? color.toHexString() : undefined
}

function mixData (legacy) {
  return {
    transitionDuration: text(legacy.transitionDuration) ?? '0',
    transitionEasing: lowerFirst(text(legacy.tween))
  }
}

function transitionData (legacy) {
  return {
    ...mixData(legacy),
    transitionName: String(indexOfEnum(types.TRANSITION_NAME_ENUM, legacy.transition)),
    transitionDirection: String(indexOfEnum(types.TRANSITION_DIRECTION_ENUM, legacy.direction))
  }
}

function templateData (node) {
  const data = {}
  for (const component of toArray(node?.componentdata)) {
    const id = text(component?.id)
    if (id != null) {
      data[id] = text(component.value) ?? ''
    }
  }
  return data
}

/**
 * Mappers from legacy item types to a Bridge type and
 * the properties to store under the item's 'caspar' key
 */
const MAPPERS = {
  SEPARATOR: {
    type: 'bridge.types.comment',
    plain: true
  },
  MOVIE: {
    type: 'bridge.caspar.media',
    map: legacy => ({ target: text(legacy.name), loop: isTrue(legacy.loop), ...transitionData(legacy) }),
    warn: legacy => (Number(text(legacy.seek)) || Number(text(legacy.length))) ? 'seek and length are not imported' : undefined
  },
  STILL: {
    type: 'bridge.caspar.media',
    map: legacy => ({ target: text(legacy.name), ...transitionData(legacy) })
  },
  TEMPLATE: {
    type: 'bridge.caspar.template',
    map: legacy => ({
      target: text(legacy.name),
      cgLayer: text(legacy.flashlayer) != null ? Number(text(legacy.flashlayer)) : undefined,
      data: templateData(legacy.templatedata)
    })
  },
  FILL: {
    type: 'bridge.caspar.transform',
    map: legacy => ({
      x: text(legacy.positionx),
      y: text(legacy.positiony),
      width: text(legacy.scalex),
      height: text(legacy.scaley),
      ...mixData(legacy)
    })
  },
  VOLUME: {
    type: 'bridge.caspar.volume',
    map: legacy => ({ volume: text(legacy.volume), ...mixData(legacy) })
  },
  OPACITY: {
    type: 'bridge.caspar.opacity',
    map: legacy => ({ opacity: text(legacy.opacity), ...mixData(legacy) })
  },
  IMAGESCROLLER: {
    type: 'bridge.caspar.image-scroller',
    map: legacy => ({
      target: text(legacy.name),
      speed: text(legacy.speed),
      blur: text(legacy.blur),
      premultiply: isTrue(legacy.premultiply),
      progressive: isTrue(legacy.progressive)
    })
  },
  CLEAROUTPUT: {
    type: 'bridge.caspar.clear',
    map: legacy => ({}),
    clearsChannel: legacy => isTrue(legacy.clearchannel)
  },
  CUSTOMCOMMAND: {
    type: 'bridge.caspar.amcp',
    map: legacy => ({ amcp: text(legacy.playCommand) }),
    skip: legacy => text(legacy.playCommand) ? undefined : 'it has no play command'
  }
}

/**
 * Resolve a legacy item's device name to a server id
 * @param { any } legacy
 * @param { string } label
 * @param {{ servers: Map<string, string>, warnings: string[] }} ctx
 * @returns { string }
 */
function resolveServer (legacy, label, ctx) {
  const deviceName = text(legacy.devicename)
  const server = ctx.servers.get(deviceName?.toLowerCase())
  if (server) {
    return server
  }

  ctx.warnings.push(`"${label}": server "${deviceName}" was not found, using the default server`)
  return types.DEFAULT_SERVER_ID
}

/**
 * Convert frames to milliseconds using the frame rate of a
 * connected channel, falling back to a default if it's unknown
 * @returns { number }
 */
function framesToMs (frames, serverId, channelId, label, ctx) {
  if (!(frames > 0)) {
    return 0
  }

  const channel = (commands.getServer(serverId)?.channels || [])
    .find(channel => `${channel?.id}` === channelId)

  let frameRate = parseFloat(channel?.frameRate)
  if (!(frameRate > 0)) {
    ctx.warnings.push(`"${label}": the frame rate of channel ${channelId} is unknown, assuming ${DEFAULT_FRAME_RATE} fps`)
    frameRate = DEFAULT_FRAME_RATE
  }
  return Math.round(frames / frameRate * 1000)
}

/**
 * Import a fade to black as a group of items: fade the layer's
 * opacity to 0, clear the layer once faded and restore the opacity
 * @param { any } legacy
 * @param { string } parentId
 * @param {{ servers: Map<string, string>, warnings: string[], count: number }} ctx
 * @param {{ label: string, color?: string, tag?: string }} common
 */
async function importFadeToBlack (legacy, parentId, ctx, { label, color, tag }) {
  const caspar = {
    server: resolveServer(legacy, label, ctx),
    channel: text(legacy.channel),
    layer: text(legacy.videolayer)
  }

  const mix = mixData(legacy)
  const fadeMs = framesToMs(Number(mix.transitionDuration), caspar.server, caspar.channel, label, ctx)

  const groupId = await bridge.items.createItem('bridge.types.group', compact({
    name: label,
    color,
    tag,
    delay: text(legacy.delay),
    playMode: GROUP_PLAY_MODE_FIRST
  }))

  /*
  Only the first step is triggered by the group, each step then plays
  the next when it ends. Items without a duration end immediately
  */
  const steps = [
    ['bridge.caspar.opacity', {
      name: `${label}: Fade out`,
      duration: fadeMs > 0 ? String(fadeMs) : undefined,
      onEnd: ON_END_PLAY_NEXT_SIBLING,
      caspar: compact({ ...caspar, ...mix, opacity: '0' })
    }],
    ['bridge.caspar.clear', {
      name: `${label}: Clear`,
      onEnd: ON_END_PLAY_NEXT_SIBLING,
      caspar
    }],
    ['bridge.caspar.opacity', {
      name: `${label}: Reset opacity`,
      caspar: { ...caspar, opacity: '1', transitionDuration: '0' }
    }]
  ]

  for (const [type, data] of steps) {
    const itemId = await bridge.items.createItem(type, compact(data))
    await bridge.commands.executeCommand('rundown.appendItem', groupId, itemId)
  }

  await bridge.commands.executeCommand('rundown.appendItem', parentId, groupId)
  ctx.count++
}

/**
 * Import the items of a legacy rundown, depth first,
 * into the parent with the specified id
 * @param { any[] } legacyItems
 * @param { string } parentId
 * @param {{ servers: Map<string, string>, warnings: string[], count: number }} ctx
 */
async function importItems (legacyItems, parentId, ctx) {
  for (const legacy of legacyItems) {
    const kind = text(legacy?.type)?.toUpperCase()
    const label = text(legacy?.label) || text(legacy?.name) || kind
    const notes = text(legacy?.notes)
    const color = parseColor(legacy?.color)

    /*
    The legacy remote trigger id (UID) is a tag in Bridge
    */
    const tag = text(legacy?.remotetriggerid) || undefined

    if (kind === 'GROUP') {
      const groupId = await bridge.items.createItem('bridge.types.group', compact({ name: label, notes, color, tag }))
      await importItems(toArray(legacy.items?.item), groupId, ctx)
      await bridge.commands.executeCommand('rundown.appendItem', parentId, groupId)
      ctx.count++
      continue
    }

    if (kind === 'FADETOBLACK') {
      await importFadeToBlack(legacy, parentId, ctx, { label, color, tag })
      continue
    }

    const mapper = MAPPERS[kind]
    if (!mapper) {
      ctx.warnings.push(`"${label}" was skipped, item type ${kind} is not supported`)
      continue
    }

    const reasonToSkip = mapper.skip?.(legacy)
    if (reasonToSkip) {
      ctx.warnings.push(`"${label}" was skipped, ${reasonToSkip}`)
      continue
    }

    const warning = mapper.warn?.(legacy)
    if (warning) {
      ctx.warnings.push(`"${label}": ${warning}`)
    }

    /*
    Plain items, such as comments, don't
    have any server, timing or tag
    */
    if (mapper.plain) {
      const commentId = await bridge.items.createItem(mapper.type, compact({ name: label, notes, color }))
      await bridge.commands.executeCommand('rundown.appendItem', parentId, commentId)
      ctx.count++
      continue
    }

    const server = resolveServer(legacy, label, ctx)

    const duration = Number(text(legacy.duration))

    /*
    The caspar object replaces the type's defaults
    as it's set when the item is created
    */
    const itemId = await bridge.items.createItem(mapper.type, compact({
      name: label,
      notes,
      color,
      tag,
      delay: text(legacy.delay),
      duration: duration > 0 ? String(duration) : undefined,
      caspar: compact({
        server,
        channel: text(legacy.channel),
        layer: mapper.clearsChannel?.(legacy) ? undefined : text(legacy.videolayer),
        ...mapper.map(legacy)
      })
    }))

    await bridge.commands.executeCommand('rundown.appendItem', parentId, itemId)
    ctx.count++
  }
}

/**
 * Import a legacy CasparCG Client rundown into a new group
 * that's appended to the main rundown
 *
 * @param { string } xml The contents of the legacy rundown file
 * @param { string } name A name for the new group
 * @returns {Promise.<{ groupId: string, imported: number, warnings: string[] }>}
 */
async function importRundown (xml, name = DEFAULT_GROUP_NAME) {
  if (typeof xml !== 'string' || !xml.trim()) {
    throw new CommandError('Parameter xml must be a non-empty string', 'ERR_BAD_PARAMETER')
  }

  const root = XmlParser.parse(xml)?.items
  if (!root || typeof root !== 'object') {
    throw new CommandError('Unable to read the rundown, expected an XML document with an <items> root', 'ERR_BAD_PARAMETER')
  }

  const servers = new Map(
    (await commands.listServers()).map(server => [server.name?.toLowerCase(), server.id])
  )

  const ctx = { servers, warnings: [], count: 0 }

  /*
  Collect everything in a new group and only attach
  it to the main rundown when it's complete
  */
  const groupId = await bridge.items.createItem('bridge.types.group', { name: name || DEFAULT_GROUP_NAME, color: IMPORT_GROUP_COLOR })
  await importItems(toArray(root.item), groupId, ctx)
  await bridge.commands.executeCommand('rundown.appendItem', MAIN_RUNDOWN_ID, groupId)

  return { groupId, imported: ctx.count, warnings: ctx.warnings }
}
exports.importLegacyRundown = importRundown

bridge.commands.registerCommand('caspar.importRundown', importRundown, {
  label: 'Import from CasparCG client',
  description: 'Import a CasparCG Client XML rundown into a new group at the end of the main rundown. Returns the id of the group, the number of imported items and any warnings',
  args: {
    type: 'array',
    prefixItems: [
      { type: 'string', contentMediaType: 'application/xml', description: 'The contents of the rundown XML file' },
      { type: 'string', description: `A name for the new group, defaults to "${DEFAULT_GROUP_NAME}"` }
    ],
    minItems: 1,
    maxItems: 2
  },
  exposed: true
})

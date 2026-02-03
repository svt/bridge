// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const types = require('./types')

/**
 * @typedef {{
 *   channel: Number | undefined,
 *   layer: Number | undefined,
 *   cgLayer: Number | undefined
 * }} AMCPOptions
 */

/**
 * Construct a channel-layer string
 * for use in commands
 * @param { AMCPOptions | undefined } opts
 * @returns { string }
 */
function layerString (opts = {}) {
  if (opts.channel == null) {
    return ''
  }
  if (opts.layer == null) {
    return `${opts.channel}`
  }
  return `${opts.channel}-${opts.layer}`
}

/**
 * Construct a transition-string
 * for use in commands
 * @param { AMCPOptions | undefined } opts
 * @returns { string }
 */
function transitionString (opts = {}) {
  return ` ${types.TRANSITION_NAME_ENUM[opts.transitionName] || ''} ${opts.transitionDuration || '0'} ${(opts.transitionEasing || 'LINEAR')} ${(types.TRANSITION_DIRECTION_ENUM[opts.transitionDirection] || 'LEFT')}`.toUpperCase()
}

/**
 * Construct a scale mode string
 * for use in commands
 * @param { AMCPOptions | undefined } opts
 * @returns { string }
 */
function scaleModeString (opts = {}) {
  return ` SCALE_MODE ${(types.SCALE_MODE_ENUM[opts.scaleMode] || 'STRETCH').toUpperCase()}`
}

/**
 * List media files in the media directory
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#cls
 * @param { String | undefined } dir
 */
exports.cls = (dir = '') => `CLS ${dir}`

/**
 * List template files in the template directory
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#tls
 * @param { String | undefined } dir
 */
exports.tls = (dir = '') => `TLS ${dir}`

/**
 * List font files in the template directory
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#fls
 * @param { String | undefined } dir
 */
exports.fls = (dir = '') => `FLS ${dir}`

/**
 * Get the version of the specified component
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#version
 * @param { String | undefined } component
 */
exports.version = (component = '') => `VERSION ${component}`

/**
 * Retrieves a list of the available channels
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#info
 *//**
 * Get information about a channel or a specific layer on a channel.
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#info
 * @param { AMCPOptions | undefined } opts
 */
exports.info = opts => `INFO ${layerString(opts)}`

/**
 * Clear a channel or the whole server
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#clear
 * @param { AMCPOptions | undefined } opts
 */
exports.clear = opts => `CLEAR ${layerString(opts)}`

/**
 * Load a media item in the background
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#loadbg
 * @param { string } file The file to play
 * @param { boolean } loop
 * @param { number } seek
 * @param { number } length
 * @param { string } filter
 * @param { boolean } auto
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.loadbg = (file, loop, seek, length, filter, auto, opts) => `LOADBG ${layerString(opts)}${file ? ` "${file}"` : ''}${loop ? ' LOOP' : ''}${seek ? ` SEEK ${seek}` : ''}${length ? ` LENGTH ${length}` : ''}${filter ? ` FILTER ${filter}` : ''}${transitionString(opts)}${scaleModeString(opts)} ${auto ? 'AUTO' : ''}`

/**
 * Play a media item in the foreground
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#play
 * @param { string } file The file to play
 * @param { boolean } loop
 * @param { number } seek
 * @param { number } length
 * @param { string } filter
 * @param { boolean } auto
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.play = (file, loop, seek, length, filter, auto, opts) => `PLAY ${layerString(opts)}${file ? ` "${file}"` : ''}${loop ? ' LOOP' : ''}${seek ? ` SEEK ${seek}` : ''}${length ? ` LENGTH ${length}` : ''}${filter ? ` FILTER ${filter}` : ''}${transitionString(opts)}${scaleModeString(opts)} ${auto ? ' AUTO' : ''}`

/**
 * Play a media item in the foreground that
 * has already been loaded in the background
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#play
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.playLoaded = opts => `PLAY ${layerString(opts)}`

/**
 * Play an image scroller
 * @param { string } file The file to play
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.playImageScroller = (file, opts) => `PLAY ${layerString(opts)}${file ? ` "${file}"` : ''} BLUR ${opts?.blur || 0} SPEED ${opts?.speed || 7}${opts?.progressive ? ' PROGRESSIVE' : ''}`

/**
 * Stop an item running in the foreground
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#stop
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.stop = opts => `STOP ${layerString(opts)}`

/**
 * Add a template
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#cg-add
 * @param { string } template
 * @param { Any } data
 * @param { boolean } playOnLoad
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.cgAdd = (template, data, playOnLoad = true, opts) => `CG ${layerString(opts)} ADD ${opts.cgLayer ?? 1} "${template}" ${playOnLoad ? 1 : 0} ${JSON.stringify(data || '')}`

/**
 * Stop a template
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#cg-stop
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.cgStop = opts => `CG ${layerString(opts)} STOP ${opts.cgLayer ?? 1}`

/**
 * Update a template
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#cg-update
 * @param { string } data
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.cgUpdate = (data, opts) => `CG ${layerString(opts)} UPDATE ${opts.cgLayer ?? 1} ${JSON.stringify(data || '')}`

/**
 * Change the opacity of a layer
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#mixer-opacity
 * @param { string } opacity
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.mixerOpacity = (opacity, opts) => `MIXER ${layerString(opts)} OPACITY ${opacity}${transitionString(opts)}`

/**
 * Change the volume of a layer
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#mixer-volume
 * @param { string } volume
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.mixerVolume = (volume, opts) => `MIXER ${layerString(opts)} VOLUME ${volume}${transitionString(opts)}`

/**
 * Get the thumbnail for a file
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#thumbnail-retrieve
 * @param { string } fileName
 * @returns { string }
 */
exports.thumbnailRetrieve = fileName => `THUMBNAIL RETRIEVE "${fileName}"`

/**
 * Start the HTML producer
 * @param { string } url
 * @param { AMCPOptions } opts
 * @returns { string }
 */
exports.html = (url, opts) => `PLAY ${layerString(opts)} [HTML] "${url}"${transitionString(opts)}`

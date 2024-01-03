// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

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
 * @returns { String }
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
 * @returns { String }
 */
function transitionString (opts = {}) {
  if (opts.transitionName == null) {
    return ''
  }
  return `${opts.transitionName} ${opts.transitionDuration || '0'} ${(opts.transitionEasing || 'LINEAR')} ${(opts.transitionDirection || 'LEFT')}`.toUpperCase()
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
 * Play a media item in the foreground
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#play
 * @param { String } file The file to play
 * @param { AMCPOptions } opts
 * @returns { String }
 */
exports.play = (file, opts) => `PLAY ${layerString(opts)} ${file} ${transitionString(opts)}`

/**
 * Stop an item running in the foreground
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#stop
 * @param { AMCPOptions } opts
 * @returns { String }
 */
exports.stop = opts => `STOP ${layerString(opts)}`

/**
 * Add a template
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#cg-add
 * @param { String } template 
 * @param { Any } data 
 * @param { Boolean } playOnLoad 
 * @param { AMCPOptions } opts 
 * @returns { String }
 */
exports.cgAdd = (template, data, playOnLoad = true, opts) => `CG ${layerString(opts)} ADD ${opts.cgLayer ?? 1} ${template} ${playOnLoad ? 1 : 0} ${JSON.stringify(JSON.stringify(data))}`

/**
 * Stop a template
 * @see https://github.com/CasparCG/help/wiki/AMCP-Protocol#cg-stop
 * @param { AMCPOptions } opts 
 * @returns { String }
 */
exports.cgStop = opts => `CG ${layerString(opts)} STOP ${opts.cgLayer ?? 1}`
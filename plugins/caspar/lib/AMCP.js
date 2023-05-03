// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *   channel: Number | undefined,
 *   layer: Number | undefined
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

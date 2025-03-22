// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef { 'STILL' | 'MOVIE' | 'AUDIO' | 'TEMPLATE' } LibraryAssetType
 *
 * @typedef {
 *  name: String,
 *  type: LibraryAssetType,
 *  size: String | undefined,
 *  timestamp: String | undefined,
 *  duration: String | undefined,
 *  framerate: String | undefined
 * } LibraryAsset
 */

const REX = /"(?<name>.+)"\s{2}(?<type>.+)\s(?<size>.+)\s(?<timestamp>.+)\s(?<duration>.+)\s(?<framerate>.+)/i

export const type = Object.freeze({
  still: 'STILL',
  movie: 'MOVIE',
  audio: 'AUDIO',
  template: 'TEMPLATE'
})

/**
 * Parse a library asset string
 * returned from Caspar as an object
 * @param { String } str
 * @returns { LibraryAsset }
 */
export function parseMediaAsset (str) {
  const res = REX.exec(str)
  return {
    ...(res?.groups || {}),
    type: (res?.groups?.type || '').replace(/\s/g, '')
  }
}

/**
 * Parse a library asset string
 * assuming it's a template
 * @param { String } str
 * @returns { LibraryAsset }
 */
export function parseTemplateAsset (str) {
  return {
    type: type.template,
    name: str
  }
}

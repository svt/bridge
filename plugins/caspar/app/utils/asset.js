// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {
 *  name: String,
 *  type: String,
 *  size: String,
 *  timestamp: String,
 *  duration: String,
 *  framerate: String
 * } LibraryAsset
 */

const REX = /"(?<name>.+)"\s{2}(?<type>.+)\s(?<size>.+)\s(?<timestamp>.+)\s(?<duration>.+)\s(?<framerate>.+)/i

/**
 * Parse a library asset string
 * returned from Caspar as an object
 * @param { String } str
 * @returns { LibraryAsset || {} }
 */
export function parseAsset (str) {
  const res = REX.exec(str)
  return {
    ...(res?.groups || {}),
    type: (res?.groups?.type || '').replace(/\s/g, '')
  }
}

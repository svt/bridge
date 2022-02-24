// SPDX-FileCopyrightText: 2022 Sveriges Television AB
// © 2022
//
// SPDX-License-Identifier: MIT

const DEFAULT_CHARACTER_MAP = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Generate a random string of
 * characters in the map
 *
 * This function is NOT
 * cryptographically strong
 *
 * @param { Number } length The length of the returned string
 * @param { String } map A string of characters to include
 *                       in the returned string
 * @returns { String }
 *//**
 * Generate a random string
 *
 * This function is NOT
 * cryptographically strong
 *
 * @param { Number } length The length of the returned string
 * @returns { String }
*/
function string (length = 10, map = DEFAULT_CHARACTER_MAP) {
  return Array
    .from({ length }, () => Math.round(Math.random() * map.length))
    .map(val => map[val % map.length])
    .join('')
}
exports.string = string

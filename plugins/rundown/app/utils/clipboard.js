// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Copy a string into the clipboard
 * @param { String } str A string to copy
 * @returns { Promise.<Boolean> }
 */
export function copyText (str) {
  return navigator.clipboard.writeText(str)
}

/**
 * Read the string stored in the clipboard,
 * will return an empty string if the clipboard is empty
 * @returns { Promise.<String> }
 */
export function readText () {
  return navigator.clipboard.readText()
}

/**
 * Read the contents of the clipboard as a json object,
 * will return undefined if unable to parse the data
 * @returns { Promise.<Object | undefined> }
 */
export async function readJson () {
  try {
    const str = await readText()
    return JSON.parse(str)
  } catch (_) {
    return undefined
  }
}

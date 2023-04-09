// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Copy a string into the clipboard
 * @param { String } str A string to copy
 * @returns { Promise.<Boolean> }
 */
export async function copyText (str) {
  return navigator.clipboard.writeText(str)
}

// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const THEME_CLASS_REX = /u-theme--(.+)/

/**
 * Get the closest theme class name for
 * an ancestor of the provided element
 * @param { HTMLElement} el
 * @returns { string? }
 */
export function findClosestAncestorThemeClass (el) {
  const classNames = (el.className || '').split(' ')

  for (const name of classNames) {
    const match = name.match(THEME_CLASS_REX)
    if (!match) {
      continue
    }
    return match[0]
  }

  if (!el?.parentElement) {
    return
  }

  return findClosestAncestorThemeClass(el.parentElement)
}

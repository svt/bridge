// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * Check if a mouse is connected by creating an offscreen
 * scrolling element and checking its width
 * @returns { boolean }
 */
export function mouseIsConnected () {
  const container = document.createElement('div')

  /*
  Important

  Make sure that any scrollbar styling isn't applied to this div
  or the returned result might not be correct as it checks for the
  width of the scrollbars
  */
  container.className = 'u-scrollbarStyle--none'

  Object.assign(container.style, {
    visibility: 'hidden',
    overflow: 'scroll',
    position: 'absolute',
    width: '50px',
    height: '50px',
    top: '-999px',
    msOverflowStyle: 'scrollbar'
  })

  document.body.appendChild(container)
  const scrollbarWidth = container.offsetWidth - container.clientWidth
  document.body.removeChild(container)
  return scrollbarWidth > 0
}

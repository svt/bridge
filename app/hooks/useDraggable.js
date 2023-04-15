// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import React from 'react'

/**
 * Make an element draggable
 *
 * Will attach listeners to the provided element
 * and return a pair of pixel values representing
 * the dragged offset
 *
 * @param { HTMLElement } el
 * @returns { [Number, Number }
 */
export const useDraggable = el => {
  const [origin, setOrigin] = React.useState()
  const [offset, setOffset] = React.useState([0, 0])
  const [prevOffset, setPrevOffset] = React.useState([0, 0])

  React.useEffect(() => {
    function onUp () {
      setPrevOffset(offset)
      setOrigin(undefined)
    }
    window.addEventListener('mouseup', onUp)

    function onMove (e) {
      if (!origin) {
        return
      }
      setOffset([
        e.clientX - origin[0] + prevOffset[0],
        e.clientY - origin[1] + prevOffset[1]
      ])
    }
    window.addEventListener('mousemove', onMove)

    return () => {
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
    }
  }, [origin, offset, prevOffset])

  /*
  Update the origin coordinates
  every time the mouse is down
  */
  React.useEffect(() => {
    if (!el) {
      return
    }
    function onDown (e) {
      setOrigin([e.clientX, e.clientY])
    }
    el.addEventListener('mousedown', onDown)
    return () => el.removeEventListener('mousedown', onDown)
  }, [el, offset])

  return [offset]
}

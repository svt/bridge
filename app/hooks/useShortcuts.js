// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import React from 'react'

export const useShortcuts = () => {
  const [keys, setKeys] = React.useState({})

  React.useEffect(() => {
    function onKeyDown (e) {
      console.log('Key down', e)
    }
    window.addEventListener('keyDown', onKeyDown)

    function onKeyUp (e) {
      console.log('Key up', e)
    }
    window.addEventListener('keyUp', onKeyUp)

    return () => {
      window.removeEventListener('keyDown', onKeyDown)
      window.removeEventListener('keyUp', onKeyUp)
    }
  }, [])

  /**
   * An array
   */
  const keysArr = Object.keys(keys)
    .filter(key => keys[key])

  return [keysArr]
}

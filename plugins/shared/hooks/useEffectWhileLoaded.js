import React from 'react'

/**
 * A wrapper for useEffect that unloads on pagehide,
 * making sure unload is called when the page is unloaded
 * @param { Function<Function<void>> } fn
 * @param { any[] } deps
 */
export function useEffectWhileLoaded (fn = () => {}, deps = []) {
  React.useEffect(() => {
    const doUnload = fn()
    function unload () {
      doUnload?.()
    }

    window.addEventListener('pagehide', unload)
    return () => {
      window.removeEventListener('pagehide', unload)
      unload()
    }
  }, deps)
}

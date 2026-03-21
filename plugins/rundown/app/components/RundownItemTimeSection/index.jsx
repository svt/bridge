import React from 'react'
import bridge from 'bridge'

import './style.css'

const MS = {
  hour: 3600000,
  minute: 60000,
  second: 1000
}

function zeroPad (n) {
  if (n < 10) {
    return `0${n}`
  }
  return `${n}`
}

function formatTime (ms, format = 'h:m:s') {
  const formatters = {
    h: () => Math.floor(ms / MS.hour),
    m: () => Math.floor((ms - formatters.h() * MS.hour) / MS.minute),
    s: () => Math.floor((ms - formatters.h() * MS.hour - formatters.m() * MS.minute) / MS.second)
  }

  let out = ''
  for (let i = 0; i < format.length; i++) {
    if (formatters[format[i]]) {
      out += zeroPad(formatters[format[i]]())
    } else {
      out += format[i]
    }
  }

  return out
}

export function RundownItemTimeSection ({ item }) {
  const [remaining, setRemaining] = React.useState()

  React.useEffect(() => {
    if (item?.state !== 'playing' && item?.state !== 'scheduled') {
      setRemaining(0)
      return
    }

    let shouldLoop = true

    async function loop () {
      if (!shouldLoop) {
        return
      }

      let remaining = 0

      const now = await bridge.time.now()

      switch (item?.state) {
        case 'playing':
          remaining = Math.min(item?.data?.duration - (now - item?.didStartPlayingAt), item?.data?.duration)
          break
        case 'scheduled':
          remaining = item?.willStartPlayingAt - now
          break
        default:
          setRemaining(undefined)
          return
      }

      if (Number.isNaN(remaining)) {
        setRemaining(undefined)
        return
      }
      
      setRemaining(Math.max(remaining, 0))

      /*
      Prevent the loop from continuing
      if there is no remaining time
      */
      if (remaining < 0) {
        shouldLoop = false
        return
      }
      window.requestAnimationFrame(loop)
    }
    loop()

    return () => { shouldLoop = false }
  }, [item?.state, item?.didStartPlayingAt, item?.willStartPlayingAt])

  if (
    remaining == null
    || !['playing', 'scheduled'].includes(item?.state)
    || remaining <= 0
  ) {
    return <></>
  }

  return (
    <div className='RundownItemTimeSection'>
      <div className='RundownItemProgress-value'>-
        {
          item?.data?.duration >= MS.hour
            ? formatTime(remaining + MS.second, 'h:m:s')
            : formatTime(remaining + MS.second, 'm:s')
        }
      </div>
    </div>
  )
}

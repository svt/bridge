import React from 'react'
import bridge from 'bridge'

import './style.css'

export function RundownItemProgress ({ item }) {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    if (item?.state !== 'playing' && item?.state !== 'scheduled') {
      setProgress(0)
      return
    }

    let shouldLoop = true

    async function loop () {
      if (!shouldLoop) {
        return
      }

      let progress = 0
      const now = await bridge.time.now()

      switch (item?.state) {
        case 'playing':
          progress = (now - item?.didStartPlayingAt) / item?.data?.duration
          break
        case 'scheduled':
          progress = (item?.willStartPlayingAt - now) / (item?.willStartPlayingAt - item?.wasScheduledAt)
          break
      }

      /*
      Reset and stop the loop if the
      progress is undefined or more than 1
      */
      if (Number.isNaN(progress) || progress >= 1) {
        setProgress(0)
        shouldLoop = false
        return
      }

      setProgress(Math.max(Math.min(progress, 1), 0))
      window.requestAnimationFrame(loop)
    }
    loop()

    return () => { shouldLoop = false }
  }, [item?.state, item?.didStartPlayingAt, item?.willStartPlayingAt])

  return (
    <div className='RundownItemProgress'>
      {
        ['playing', 'scheduled'].includes(item?.state) &&
        <div className='RundownItemProgress-progress' style={{ transform: `scale(${progress}, 1)`, backgroundColor: item?.data?.color }} />
      }
    </div>
  )
}

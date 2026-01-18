import React from 'react'
import './style.css'

function zeroPad (num) {
  if (typeof num !== 'number') return num
  if (num < 10) return `0${num}`
  return `${num}`
}

export const Clock = ({ frame }) => {
  const components = React.useMemo(() => {
    if (!frame) {
      return ['--', '--', '--']
    }

    return [
      frame.hours,
      frame.minutes,
      frame.seconds,
      frame.frames,
      frame.milliseconds
    ]
      .filter(component => component != null)
  }, [frame])

  return (
    <span className='Clock'>
      {
        (components || [])
          .map(component => {
            return zeroPad(component)
          })
          .join(':')
      }
    </span>
  )
}

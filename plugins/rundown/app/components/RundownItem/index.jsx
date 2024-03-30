import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

import * as Layout from '../Layout'

export function RundownItem ({ index, item }) {
  const [shared] = React.useContext(SharedContext)
  const [progress, setProgress] = React.useState(0)

  const displaySettings = shared?.plugins?.['bridge-plugin-rundown']?.settings?.display

  const properties = [
    { if: displaySettings?.id, name: 'ID', value: item?.id },
    { if: displaySettings?.type, name: 'Type', value: item?.type }
  ]

  React.useEffect(() => {
    if (item?.state !== 'playing' && item?.state !== 'scheduled') {
      setProgress(0)
      return
    }

    let shouldLoop = true

    function loop () {
      if (!shouldLoop) {
        return
      }

      let progress = 0

      switch (item?.state) {
        case 'playing':
          progress = (Date.now() - item?.didStartPlayingAt) / item?.data?.duration
          break
        case 'scheduled':
          progress = (item?.willStartPlayingAt - Date.now()) / (item?.willStartPlayingAt - item?.wasScheduledAt)
          break
      }

      if (Number.isNaN(progress)) {
        return
      }

      setProgress(Math.max(Math.min(progress, 1), 0))

      if (progress >= 1 && item?.state === 'playing') {
        return
      }
      window.requestAnimationFrame(loop)
    }
    loop()

    return () => { shouldLoop = false }
  }, [item?.state, item?.didStartPlayingAt, item?.willStartPlayingAt])

  return (
    <div className='RundownItem'>
      <Layout.Spread>
        <div className='RundownItem-section'>
          <div className='RundownItem-color' style={{ backgroundColor: item?.data?.color }} />
          <div className='RundownItem-background' style={{ backgroundColor: item?.data?.color }} />
          <div className='RundownItem-index'>
            {index}
          </div>
          <div className='RundownItem-name'>
            {item?.data?.name}
          </div>
          {
            displaySettings?.notes &&
            (
              <div className='RundownItem-notes'>
                {item?.data?.notes}
              </div>
            )
          }
        </div>
        <div className='RundownItem-section'>
          {
            properties
              .filter(property => property.if)
              .map((property, i) => (
                <div className='RundownItem-property' key={i}>
                  {
                    !property.hiddenName &&
                      <div className='RundownItem-propertyName'>{property.name}:</div>
                  }
                  <div>{property.value}</div>
                </div>
              ))
          }
        </div>
      </Layout.Spread>
      {
        ['playing', 'scheduled'].includes(item?.state) &&
        <div className='RundownItem-progress' style={{ transform: `scale(${progress}, 1)`, backgroundColor: item?.data?.color }} />
      }
    </div>
  )
}

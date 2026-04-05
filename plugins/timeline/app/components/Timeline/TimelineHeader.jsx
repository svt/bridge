import React from 'react'

import './TimelineHeader.css'

import * as utils from './utils'

export function TimelineHeader ({ spec }) {
  const [blockDuration, setBlockDuration] = React.useState(utils.UNIT_MS_DURATION.second)

  React.useEffect(() => {
    const blockDurationMs = utils.getDisplayUnitDurationMS(spec.scale, spec.frameRate)
    setBlockDuration(blockDurationMs)
  }, [spec])

  const blockWidth = utils.getPixelWidth(blockDuration, spec.scale)

  return (
    <>
      <div className='TimelineHeader-backgroundColor' />
      <div className='TimelineHeader-backgroundBlur' />
      <div className='TimelineHeader'>
        {
          Array.from(Array(Math.ceil((spec.duration || 0) / blockDuration)).fill(undefined))
            .map((_, i) => {
              return (
                <div key={i} className='TimelineHeader-block' style={{ width: `${blockWidth}px` }}>
                  <div className='TimelineHeader-blockTimecode'>
                    {utils.getSMPTETimecodeFromMs(blockDuration * i, spec.frameRate)}
                  </div>
                </div>
              )
            })
        }
      </div>
    </>
  )
}
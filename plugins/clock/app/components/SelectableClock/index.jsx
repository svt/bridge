import React from 'react'
import bridge from 'bridge'

import './style.css'

import { Clock } from '../Clock'

const DEFAULT_CLOCK_ID = 'main'

export const SelectableClock = ({ clockId = window.WIDGET_DATA?.['clockId'] || DEFAULT_CLOCK_ID }) => {
  const [clocks, setClocks] = React.useState([])
  const [lastFrame, setLastFrame] = React.useState()

  React.useEffect(() => {
    () => console.log('Detaching')
  }, [])

  React.useEffect(() => {
    function onClocksChange (newClocks) {
      setClocks(newClocks)
    }

    bridge.events.on('time.clocks.change', onClocksChange)
    return () => {
      bridge.events.off('time.clocks.change', onClocksChange)
    }
  }, [])

  React.useEffect(() => {
    async function initiallyUpdateClocks () {
      const clocks = await bridge.time.getAllClocks()
      setClocks(clocks)
    }
    initiallyUpdateClocks()
  }, [])

  React.useEffect(() => {
    if (!clockId) {
      return
    }

    function onFrame (newFrame) {
      setLastFrame(newFrame)
    }

    bridge.events.on(`time.frame.${clockId}`, onFrame)
    return () => {
      console.log('Detaching listener')
      bridge.events.off(`time.frame.${clockId}`, onFrame)
    }
  }, [clockId])

  function handleClockSelectChange (e) {
    window.WIDGET_UPDATE({
      'clockId': e.target.value
    })
  }

  return (
    <div className='SelectableClock'>
      <header className='SelectableClock-header'>
        <select value={clockId || ''} onChange={e => handleClockSelectChange(e)}>
          {
            clocks.map(clock => {
              return <option key={clock.id} value={clock.id}>{clock.label || 'Unnamed clock'}</option>
            })
          }
        </select>
      </header>
      <div className='SelectableClock-body'>
        <Clock frame={lastFrame} />
      </div>
    </div>
  )
}

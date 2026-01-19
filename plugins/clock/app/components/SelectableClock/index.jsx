import React from 'react'
import bridge from 'bridge'

import './style.css'

import { Clock } from '../Clock'

const DEFAULT_CLOCK_ID = 'main'

export const SelectableClock = ({ clockId: _clockId = window.WIDGET_DATA?.['clockId'] || DEFAULT_CLOCK_ID }) => {
  const [clocks, setClocks] = React.useState([])
  const [clockId, setClockId] = React.useState(_clockId)
  const [lastFrame, setLastFrame] = React.useState()

  React.useEffect(() => {
    function onClocksChange (newClocks) {
      console.log('Setting clocks')
      setClocks(newClocks)
    }

    bridge.events.on('time.clocks.change', onClocksChange)
    return () => {
      bridge.events.off('time.clocks.change', onClocksChange)
    }
  }, [])

  React.useEffect(() => {
    console.log('Mount')
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

    function unload () {
      console.log('Unloading')
      bridge.events.off(`time.frame.${clockId}`, onFrame)
    }

    setLastFrame(undefined)
    bridge.events.on(`time.frame.${clockId}`, onFrame)
    window.addEventListener('beforeunload', unload)
    return () => {
      window.removeEventListener('beforeunload', unload)
      unload()
    }
  }, [clockId])

  function handleClockSelectChange (e) {
    setClockId(e.target.value)
    window.WIDGET_UPDATE({
      'clockId': e.target.value
    })
  }

  return (
    <div className='SelectableClock'>
      <header className='SelectableClock-header'>
        <select className='Select--small' value={clockId || ''} onChange={e => handleClockSelectChange(e)}>
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

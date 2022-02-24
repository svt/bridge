import React from 'react'
import bridge from 'bridge'

import Average from './Average'
import { CurrentTime } from './components/CurrentTime'

/**
 * Declare how large our running
 * average should be timewise
 * @type { Number }
 */
const AVERAGE_TIME_SPAN_MS = 10000

/**
 * Declare how often we should request a
 * new timestamp from the main process
 * @type { Number }
 */
const CHECK_INTERVAL_MS = 1000

/**
 * Titles based on
 * the specified view,
 * these will be shown
 * in the widget
 * @type { Object.<String, String> }
 */
const TITLES = {
  latency: 'Command latency',
  time: 'Current time'
}

export default function App () {
  const [latency, setLatency] = React.useState(0)
  const [time, setTime] = React.useState(Date.now())

  const [view, setView] = React.useState()

  React.useEffect(() => {
    const average = new Average(AVERAGE_TIME_SPAN_MS)

    /*
    Fetch a new timestamp from
    the main process and measure
    the roundtrip time to keep a
    running average
    */
    setInterval(async () => {
      const { echo, time } = await bridge.commands.executeCommand('bridge.plugins.clock.time', Date.now())
      const latency = (Date.now() - echo) / 2

      average.add(latency)

      setLatency(average.read())
      setTime(time)
    }, CHECK_INTERVAL_MS)
  }, [])

  /*

  */
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setView(params.get('view'))
  }, [])

  return (
    <div className='Clock-wrapper'>
      <div className='Clock-title'>{TITLES[view]}</div>
      {
        view === 'latency'
          ? <span className='Clock-digits'>{Math.floor(latency * 10) / 10}ms</span>
          : <CurrentTime className='Clock-digits' base={time} offset={latency} />
      }
    </div>
  )
}

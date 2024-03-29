import React from 'react'
import bridge from 'bridge'

import Average from './Average'
import { CurrentTime } from './components/CurrentTime'

/**
 * Declare how large our running
 * average should be timewise
 * @type { Number }
 */
const AVERAGE_TIME_SPAN_MS = 20000

/**
 * Declare how often we should request a
 * new timestamp from the main process
 *
 * Add a random part as we don't want
 * all clocks to sync at the same time
 *
 * @type { Number }
 */
const CHECK_INTERVAL_MS = 9000 + Math.random() * 1000

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
      {
        view === 'latency'
          ? <span className='Clock-digits'>{Math.floor(latency * 10) / 10}ms</span>
          : <CurrentTime className='Clock-digits' base={time} offset={latency} />
      }
    </div>
  )
}

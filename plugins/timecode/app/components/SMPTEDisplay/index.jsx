import bridge from 'bridge'

import React from 'react'
import './style.css'

const EASINGS = {
  linear: t => t
}

class Animation {
  #from
  #to
  #durationMs
  #easing
  #frame = () => {}

  #running = false
  #startTime

  constructor (from, to, durationMs = 1000, frame = () => {}, easing = EASINGS.linear,) {
    this.#from = from
    this.#to = to
    this.#durationMs = durationMs
    this.#easing = easing
    this.#frame = frame
  }

  #loop () {
    if (!this.#running) {
      return
    }

    if (!this.#startTime) {
      return
    }

    if (!this.#durationMs) {
      return
    }

    const now = Date.now()
    const progress = (now - this.#startTime) / this.#durationMs
    const eased = this.#easing(progress)
    const value = (this.#to - this.#from) * eased

    if (value >= 1) {
      this.#frame(this.#to, 1)
      this.stop()
      return
    }

    this.#frame(value, eased)

    window.requestAnimationFrame(() => this.#loop())
  }

  start () {
    this.#running = true
    this.#startTime = Date.now()
    this.#loop()
  }

  stop () {
    this.#running = false
    this.#startTime = undefined
  }
}

export const SMPTEDisplay = ({}) => {
  const [smpte, setSmpte] = React.useState()

  React.useEffect(() => {
    let anim
    function onFrame (frames) {
      setSmpte(frames[frames.length - 1].smpte)
/*       if (anim) {
        anim.stop()
      }

      anim = new Animation(0, frames.length, 20, i => {
        const j = Math.round(i)
        console.log('Rendering', j)
        if (frames[j]) {
          setSmpte(frames[j].smpte)
        }
      })
      anim.start() */
    }

    bridge.events.on('timecode.ltc', onFrame)
    return () => bridge.events.off('timecode.ltc', onFrame)
  }, [])

  return (
    <div className='SMPTEDisplay'>
      {smpte}
    </div>
  )
}

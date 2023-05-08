import React from 'react'
import './style.css'

import * as easings from '../../utils/easings'

export const EasingPreview = ({ easingName = 'linear' }) => {
  const canvasRef = React.useRef()

  /*
  Draw the easing function as a series of lines
  whenever the canvas or easing changes
  */
  React.useEffect(() => {
    if (!canvasRef.current) {
      return
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    /**
     * @todo
     * Parameterize these
     */
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 3

    ctx.beginPath()
    ctx.moveTo(0, canvas.height)
    for (let i = 0; i < canvas.width; i++) {
      ctx.lineTo(i, (canvas.height - easings[easingName](i / canvas.width) * canvas.height))
    }
    ctx.stroke()
  }, [canvasRef.current, easingName])

  return (
    <div className='EasingPreview'>
      <canvas ref={canvasRef} width={100} height={100} />
    </div>
  )
}

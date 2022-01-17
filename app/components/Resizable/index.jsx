import React from 'react'
import './style.css'

export function Resizable ({ children, x, y, width, height }) {
  const [posSize, setPosSize] = React.useState([x, y, width, height])
  const directionRef = React.useRef()
  const intermediateResizeRef = React.useRef([0, 0])

  function handleResize (e, direction) {
    directionRef.current = direction
    intermediateResizeRef.current = [x, y]

    console.log(e)
  }

  React.useEffect(() => {
    function resize () {
      /**
       * @type { String }
       */
      const direction = directionRef.current
      if (!direction) return

      /**
       * @type { Number[] }
       */
      const intermediate = intermediateResizeRef.current

      const newPosSize = [...posSize]

      if (direction.includes('n')) {
        newPosSize[3] -= newPosSize[1] - intermediate[1]
        newPosSize[1] = intermediate[1]
      }
    }

    window.addEventListener('mousemove', resize)
    return () => window.removeEventListener('mousemove', resize)
  }, [posSize])

  React.useEffect(() => {
    function cancelResize () {
      directionRef.current = undefined
    }

    window.addEventListener('mouseup', cancelResize)
    return () => window.removeEventListener('mouseup', cancelResize)
  }, [])

  return (
    <div className='Resizable' style={{ top: y, left: x, width, height }}>
      <div className='Resizable-border Resizable-border--top' onMouseDown={e => handleResize(e, 'n')} />
      <div className='Resizable-border Resizable-border--right' onMouseDown={e => handleResize(e, 'e')} />
      <div className='Resizable-border Resizable-border--bottom' onMouseDown={e => handleResize(e, 's')} />
      <div className='Resizable-border Resizable-border--left' onMouseDown={e => handleResize(e, 'w')} />
      <div className='Resizable-corner Resizable-corner--tl' onMouseDown={e => handleResize(e, 'nw')} />
      <div className='Resizable-corner Resizable-corner--tr' onMouseDown={e => handleResize(e, 'ne')} />
      <div className='Resizable-corner Resizable-corner--bl' onMouseDown={e => handleResize(e, 'sw')} />
      <div className='Resizable-corner Resizable-corner--br' onMouseDown={e => handleResize(e, 'se')} />
      {children}
    </div>
  )
}

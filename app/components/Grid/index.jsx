import React from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'

import { ContextMenu } from '../ContextMenu'
import { ContextMenuItem } from '../ContextMenuItem'

import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'

import './style.css'

const ReactGridLayout = WidthProvider(RGL)

export function Grid ({ layout = {}, children, onChange }) {
  const [contextPos, setContextPos] = React.useState()

  const childrenArr = Array.isArray(children)
    ? children
    : [children]

  function handleContextMenu (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  React.useEffect(() => {
    function handleWindowClick () {
      setContextPos(undefined)
    }
    window.addEventListener('click', handleWindowClick)
    return () => window.removeEventListener('click', handleWindowClick)
  }, [])

  /**
   * Trigger the onChange function
   * whenever a child item is moved
   * or resized
   * @typedef {{
   *  i: String,
   *  x: Number,
   *  y: Number,
   *  w: Number,
   *  h: Number
   * }} ItemLayout
   * @param { ItemLayout[] } layout
   */
  function handleItemChange (layout) {
    const newLayout = {}
    layout.forEach(itemLayout => {
      newLayout[itemLayout.i] = {
        x: itemLayout.x,
        y: itemLayout.y,
        w: itemLayout.w,
        h: itemLayout.h
      }
    })

    onChange({
      data: {
        layout: newLayout
      }
    })
  }

  /*
  Convert the layout data to an
  array rather than an object in
  order to satisfy the api for
  react-grid-layout
  */
  const layoutArray = Object.entries(layout).map(([id, layout]) => {
    return { i: id, ...layout }
  })

  return (
    <>
      {
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]}>
              <ContextMenuItem text='New block' />
            </ContextMenu>
            )
          : <></>
      }
      <div className='Grid' onContextMenu={handleContextMenu}>
        <ReactGridLayout
          className='Grid-layout'
          containerPadding={[5, 5]}
          margin={[2, 2]}
          verticalCompact={false}
          layout={layoutArray}
          onDragStop={handleItemChange}
          onResizeStop={handleItemChange}
          useCSSTransforms
        >
          {
            childrenArr
              .map(child => {
                return (
                  <div key={child.key} className='Grid-item'>
                    {child}
                  </div>
                )
              })
          }
        </ReactGridLayout>
      </div>
    </>
  )
}

import React from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { ContextMenu } from '../ContextMenu'
import { ContextMenuItem } from '../ContextMenuItem'

import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'

import './style.css'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

const ReactGridLayout = WidthProvider(RGL)

/**
 * Define the grid's
 * properties, these
 * are used in calculations
 * as well as element
 * attributes
 */
const GRID_COL_COUNT = 12
const GRID_ROW_COUNT = 6
const GRID_MARGIN_PX = 5

export function Grid ({ layout = {}, children, onChange }) {
  const [shared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [contextPos, setContextPos] = React.useState()
  const [rowHeight, setRowHeight] = React.useState(0)

  const elRef = React.useRef()

  /**
   * Indicating whether or not the user
   * is currently in layout edit mode
   * @type { Boolean }
   */
  const userIsEditingLayout = shared[local.id]?.isEditingLayout

  const childrenArr = Array.isArray(children)
    ? children
    : [children]

  function handleContextMenu (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  /*
  Update the row height whenever the grid
  is resized in order to keep the correct
  number of rows at all times
  */
  React.useEffect(() => {
    const observer = new window.ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return

      const height = entry.contentRect.height
      /*
      Calculate the new height and
      take the margin into account
      which will be added around each row
      */
      setRowHeight((height - (GRID_ROW_COUNT + 1) * GRID_MARGIN_PX) / GRID_ROW_COUNT)
    })
    observer.observe(elRef.current)
    return () => observer.disconnect()
  }, [])

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
      layout: newLayout
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
      <div ref={elRef} className='Grid' onContextMenu={handleContextMenu}>
        <ReactGridLayout
          className='Grid-layout'
          cols={GRID_COL_COUNT}
          maxRows={GRID_ROW_COUNT}
          rowHeight={rowHeight}
          margin={[GRID_MARGIN_PX, GRID_MARGIN_PX]}
          layout={layoutArray}
          autoSize={false}
          allowOverlap={false}
          verticalCompact={false}
          containerPadding={[GRID_MARGIN_PX, GRID_MARGIN_PX]}
          /*
          Only enable resize and drag if the user
          is currently in the edit-mode, otherwise
          display the grid as static

          Make sure to only pass proper boolean values
          as undefined or null will default to true
          */
          isDraggable={!!userIsEditingLayout}
          isResizable={!!userIsEditingLayout}
          onDragStop={handleItemChange}
          onResizeStop={handleItemChange}
          useCSSTransforms
          preventCollision
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

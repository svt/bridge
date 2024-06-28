import React from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'

import * as uuid from 'uuid'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { ContextMenu } from '../ContextMenu'
import { ContextMenuItem } from '../ContextMenuItem'
import { ContextMenuDivider } from '../ContextMenuDivider'

import { Modal } from '../Modal'
import { Notification } from '../Notification'
import { WidgetSelector } from '../WidgetSelector'
import { GridEmptyContent } from '../GridEmptyContent'

import '../../../node_modules/react-grid-layout/css/styles.css'
import '../../../node_modules/react-resizable/css/styles.css'

import './style.css'

const ReactGridLayout = WidthProvider(RGL)

/**
 * Define the grid's
 * properties, these
 * are used in calculations
 * as well as element
 * attributes
 */
const GRID_COL_COUNT = 24
const GRID_ROW_COUNT = 12
const GRID_MARGIN_PX = 3

export function Grid ({ children, data = {}, onChange }) {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [contextPos, setContextPos] = React.useState()
  const [rowHeight, setRowHeight] = React.useState(0)

  const [modalItemId, setModalItemId] = React.useState()

  const elRef = React.useRef()

  /**
   * Indicating whether or not the user
   * is currently in layout edit mode
   * @type { Boolean }
   */
  const userIsEditingLayout = shared?._connections[local.id]?.isEditingLayout

  const childrenArr = Array.isArray(children)
    ? children
    : [children]

  /*
  Convert the layout data to an
  array rather than an object in
  order to satisfy the api for
  react-grid-layout
  */
  const layoutArray = Object.entries(data.layout || {})
    .map(([id, layout]) => {
      return { i: id, ...layout }
    })

  function handleContextMenu (e, data) {
    if (!userIsEditingLayout) {
      return
    }

    e.preventDefault()
    e.stopPropagation()

    setContextPos([e.pageX, e.pageY, data])
  }

  function handleLeaveEditMode () {
    applyShared({
      _connections: {
        [local.id]: {
          isEditingLayout: false
        }
      }
    })
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

  /**
   * Create a new item as close to the
   * context position as possible
   */
  function handleNewItem () {
    const bounds = elRef.current.getBoundingClientRect()
    const colWidthPx = bounds.width / GRID_COL_COUNT
    const rowHeightPx = bounds.height / GRID_ROW_COUNT

    const col = Math.min(Math.floor(contextPos[0] / colWidthPx), GRID_COL_COUNT - 1)
    const row = Math.min(Math.floor(contextPos[1] / rowHeightPx), GRID_ROW_COUNT - 1)

    const id = uuid.v4()

    /**
     * @todo
     * Make sure collisions are handled here
     * so that react-grid-layout doesn't place
     * items outside of the view's bounds
     */

    onChange({
      layout: {
        [id]: {
          x: col,
          y: row,
          w: 1,
          h: 1
        }
      },
      children: {
        [id]: {
          component: 'bridge.internals.empty'
        }
      }
    })
  }

  /**
   * Remove an item by its id
   */
  function handleRemoveItem (id) {
    onChange({
      layout: {
        [id]: { $delete: true }
      },
      children: {
        [id]: { $delete: true }
      }
    })
  }

  /**
   * Update a single item
   * the item must be a child
   * element of this grid
   */
  function applyItem (id, set) {
    onChange({
      children: {
        [id]: set
      }
    })
  }

  /**
   * Render the correnct context menu
   * based on data from the event
   */
  function renderContextMenu (x, y, data) {
    switch (data?.type) {
      case 'grid':
        return (
          <ContextMenu x={contextPos[0]} y={contextPos[1]}>
            <ContextMenuItem text='Add widget' onClick={() => handleNewItem()} />
          </ContextMenu>
        )
      default:
        return (
          <ContextMenu x={contextPos[0]} y={contextPos[1]}>
            <ContextMenuItem text='Change' onClick={() => setModalItemId(data.id)} />
            <ContextMenuDivider />
            <ContextMenuItem text='Remove' onClick={() => handleRemoveItem(data.id)} />
          </ContextMenu>
        )
    }
  }

  return (
    <>
      {
        contextPos &&
        renderContextMenu(...contextPos)
      }
      {
        userIsEditingLayout &&
        <Notification
          icon='edit'
          type='fixed'
          title='Editing layout'
          description='Right click to manage widgets'
          controls={<button className='Button Button--ghost' onClick={() => handleLeaveEditMode()}>Leave edit mode</button>}
        />
      }
      <Modal open={modalItemId} onClose={() => setModalItemId(undefined)} size='small' shade={false} draggable>
        <WidgetSelector
          value={data.children?.[modalItemId]?.component}
          onClose={() => setModalItemId(undefined)}
          onChange={set => applyItem(modalItemId, set)}
        />
      </Modal>
      <div ref={elRef} className='Grid' onContextMenu={e => handleContextMenu(e, { type: 'grid' })}>
        {
          /*
          Render information and call to action
          to the user if the grid is currently empty
          and the user is not editing the layout
          */
          layoutArray.length === 0 &&
          !userIsEditingLayout &&
          <GridEmptyContent />
        }
        <ReactGridLayout
          className='Grid-layout'
          cols={GRID_COL_COUNT}
          maxRows={GRID_ROW_COUNT}
          rowHeight={rowHeight}
          margin={[GRID_MARGIN_PX, GRID_MARGIN_PX]}
          layout={layoutArray}
          autoSize={false}
          compactType={null}
          allowOverlap={false}
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
          /*
          Disables the initial animation
          */
          measureBeforeMount
          useCSSTransforms
          preventCollision
          isBounded
        >
          {
            childrenArr
              .map(child => {
                const isOpenInModal = modalItemId === child.key
                return (
                  <div
                    key={child.key}
                    className={`Grid-item ${isOpenInModal ? 'is-changing' : ''}`}
                    onContextMenu={e => handleContextMenu(e, { type: 'item', id: child.key })}
                  >
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

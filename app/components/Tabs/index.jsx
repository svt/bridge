import React from 'react'

import * as random from '../../utils/random'

import { PopupConfirm } from '../Popup/confirm'
import { Icon } from '../Icon'

import './style.css'

/**
 * A tab widget
 * @param { params } param0
 * @returns { React.Component }
 */
export function Tabs ({ data, onUpdate = () => {}, renderComponent = () => {}, onTabChange = () => {} }) {
  const [activeTab, setActiveTab] = React.useState()
  const [tabToRemove, setTabToRemove] = React.useState()

  const elRef = React.useRef()

  /*
  Trigger the onTabChange callback
  whenever the active tab changes
  */
  React.useEffect(() => {
    onTabChange(activeTab)
  }, [activeTab])

  /*
  Make sure that data.order is an array
  and that it contains ids of children
  every time the component is loaded
  */
  React.useEffect(() => {
    if (data.order) return
    const childIds = Object.keys(data?.children)

    const order = (data.order || childIds)
      .filter(id => data?.children[id])

    childIds.forEach(id => {
      if (order.includes(id)) return
      order.push(id)
    })

    onUpdate({
      order: { $replace: childIds }
    })
  }, [])

  /**
   * Create a new tab and place
   * it last in the tab order
   */
  function createTab () {
    const id = random.number(5)
    onUpdate({
      order: { $replace: [...data.order, id] },
      children: {
        [id]: {
          component: 'bridge.internals.grid'
        }
      }
    })
  }

  /**
   * Reorder a tab to a new index
   * @param { String } id The id of a child
   * @param { Number } index The tab's new index
   */
  function reorderTab (id, index) {
    const newOrder = data?.order
    const curIndex = data?.order.indexOf(id)

    newOrder.splice(curIndex, 1)
    newOrder.splice(index, 0, id)

    onUpdate({
      order: { $replace: newOrder }
    })
  }

  /**
   * Remove a tab completely,
   * will update the order and
   * remove the child from the
   * component tree
   * @param { String } id The id of a child to remove
   */
  function removeTab (id) {
    const newOrder = data?.order
    const curIndex = data?.order.indexOf(id)

    newOrder.splice(curIndex, 1)

    onUpdate({
      order: { $replace: newOrder },
      children: {
        [id]: { $delete: true }
      }
    })
  }

  React.useEffect(() => {
    if (activeTab !== undefined && data.children?.[activeTab]) {
      return
    }
    setActiveTab(data.order?.[0])
  }, [data.order])

  function clearDragOverClass () {
    const elements = elRef.current.querySelectorAll('.is-draggedOver')
    for (const element of elements) {
      element.classList.remove('is-draggedOver')
    }
  }

  function handleTabClick (i) {
    setActiveTab(i)
  }

  function handleTabClose (e, id) {
    e.stopPropagation()
    setTabToRemove(id)
  }

  function handleConfirmChange (confirmed) {
    if (confirmed) removeTab(tabToRemove)
    setTabToRemove(undefined)
  }

  function handleChildUpdate (id, child) {
    onUpdate({
      children: {
        [id]: child
      }
    })
  }

  function handleTabDragOver (e) {
    e.preventDefault()
    clearDragOverClass()
    e.target.classList.add('is-draggedOver')
  }

  function handleTabDrop (e, i) {
    clearDragOverClass()
    const id = e.dataTransfer.getData('id')
    /*
    Only allow tabs to be dropped

    If the dropped item's id doesn't
    exist as a child we return
    */
    if (!data?.children[id]) return
    reorderTab(id, i)
    setActiveTab(id)
  }

  function handleTabDragStart (e, id) {
    e.dataTransfer.setData('id', id)
  }

  function handleCreateTabClick () {
    createTab()
  }

  return (
    <>
      <PopupConfirm open={tabToRemove} onChange={handleConfirmChange} confirmText='Close tab' abortText='Cancel'>
        <div className='u-heading--2'>Do you want to<br />close the tab?</div>
        Its layout will be erased
      </PopupConfirm>
      <div className='Tabs' ref={elRef}>
        <div className='Tabs-bar'>
          {
            (data?.order || [])
              .map(id => [id, data?.children[id]])
              .map(([id, child], i) => {
                const isActive = id === activeTab
                return (
                  <div
                    key={i}
                    className={`Tabs-tab ${isActive ? 'is-active' : ''}`}
                    onDrop={e => handleTabDrop(e, i)}
                    onClick={() => handleTabClick(id)}
                    onDragOver={e => handleTabDragOver(e)}
                    onDragStart={e => handleTabDragStart(e, id)}
                    draggable
                  >
                    {
                      data.order?.length > 1
                        ? (
                          <button
                            className='Tabs-tabCloseBtn'
                            onClick={e => handleTabClose(e, id)}
                          >
                            <Icon name='close' />
                          </button>
                          )
                        : <></>
                    }
                    {child?.title || 'Untitled'}
                  </div>
                )
              })
          }
          <div className='Tabs-actions'>
            <button className='Tabs-tabCreateBtn' onClick={() => handleCreateTabClick()}>
              <Icon name='add' />
            </button>
          </div>
          <div
            className='Tabs-filler'
            onDragOver={e => handleTabDragOver(e)}
            onDrop={e => handleTabDrop(e, data.order?.length)}
          />
        </div>
        <div className='Tabs-content'>
          {
            data?.children[activeTab]
              ? renderComponent(data?.children[activeTab], data => handleChildUpdate(activeTab, data))
              : <></>
          }
        </div>
      </div>
    </>
  )
}

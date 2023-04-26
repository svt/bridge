import React from 'react'

import * as random from '../../utils/random'

import { PopupConfirm } from '../Popup/confirm'
import { Tabs } from '../Tabs'

/**
 * A tab widget
 * @param { params } param0
 * @returns { React.Component }
 */
export function TabsComponent ({ data, onUpdate = () => {}, renderComponent = () => {} }) {
  const [activeTab, setActiveTab] = React.useState()
  const [tabToRemove, setTabToRemove] = React.useState()

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

  function renderTabContent (id) {
    if (!data?.children[id]) {
      return <></>
    }
    return renderComponent(data?.children[activeTab], data => handleChildUpdate(activeTab, data))
  }

  const tabs = (data?.order || [])
    .map(id => {
      return {
        id,
        title: data?.children?.[id]?.title
      }
    })

  return (
    <>
      <PopupConfirm open={tabToRemove} onChange={handleConfirmChange} confirmText='Close tab' abortText='Cancel'>
        <div className='u-heading--2'>Do you want to<br />close the tab?</div>
        Its layout will be erased
      </PopupConfirm>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onActive={id => setActiveTab(id)}
        onCreate={() => createTab()}
        onReorder={(id, newIndex) => reorderTab(id, newIndex)}
        onRemove={id => setTabToRemove(id)}
        renderTabContent={renderTabContent}
        allowReorder
        allowRemove
        allowCreate
      />
    </>
  )
}

import React from 'react'

import * as random from '../../utils/random'

import { ContextMenu } from '../ContextMenu'
import { ContextMenuItem } from '../ContextMenuItem'
import { ContextMenuDivider } from '../ContextMenuDivider'

import { PopupConfirm } from '../Popup/confirm'
import { Tabs } from '../Tabs'

import { WidgetRenderer } from '../WidgetRenderer'

/**
 * A tab widget
 * @param { params } param0
 * @returns { React.Component }
 */
export function TabsComponent ({ data, onUpdate = () => {} }) {
  const [activeTab, setActiveTab] = React.useState()
  const [tabToRemove, setTabToRemove] = React.useState()

  /**
   * Keep track of the name being
   * edited when renaming a tab
   * @type {[String, Function.<void>]}
   */
  const [renamingValue, setRenamingValue] = React.useState()
  const [tabToRename, setTabToRename] = React.useState()

  /**
   * @typedef {[
   *  x,
   *  y,
   *  id
   * ]} ContextParams
   * @type { [ContextParams, Function.<void>] }
   */
  const [contextParams, setContextParams] = React.useState()

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

  /*
  Ensure that a tab is always selected,
  try to select the first tab if for example
  the currently selected tab is removed
  */
  React.useEffect(() => {
    if (activeTab !== undefined && data.children?.[activeTab]) {
      return
    }
    setActiveTab(data.order?.[0])
  }, [data.order])

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

  function handleRemoveConfirmChange (confirmed) {
    if (confirmed) {
      removeTab(tabToRemove)
    }
    setTabToRemove(undefined)
  }

  function handleContextMenu (e, id) {
    e.preventDefault()
    setContextParams([e.pageX, e.pageY, id])
  }

  /**
   * Open the rename-popup
   * for a tab by id
   * @param { String } id
   */
  function handleRenameOpen (id) {
    setTabToRename(id)
    setRenamingValue(data?.children?.[id]?.title || 'Untitled')
  }

  function handleRenameChange (confirmed) {
    if (confirmed) {
      handleChildUpdate(tabToRename, {
        title: renamingValue
      })
    }
    setTabToRename(undefined)
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
    return <WidgetRenderer data={data?.children[activeTab]} onUpdate={data => handleChildUpdate(activeTab, data)} />
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
    {
        contextParams &&
        (
          <ContextMenu x={contextParams[0]} y={contextParams[1]} onClose={() => setContextParams(undefined)}>
            <ContextMenuItem text='Rename' onClick={() => handleRenameOpen(contextParams[2])} />
            {
              /*
              Prevent the tab to be removed if there's only one tab left,
              similar to what the Tabs-component is doing
              */
              data?.order?.length > 1 &&
              (
              <>
                <ContextMenuDivider />
                <ContextMenuItem text='Remove' onClick={() => setTabToRemove(contextParams[2])} />
              </>
              )
            }
          </ContextMenu>
        )
      }
      <PopupConfirm open={tabToRemove} onChange={handleRemoveConfirmChange} confirmText='Remove tab' abortText='Cancel'>
        <div className='u-heading--2'>Do you want to<br />remove the tab?</div>
        Its content will be erased
      </PopupConfirm>
      <PopupConfirm open={tabToRename} onChange={handleRenameChange} confirmText='OK' abortText='Cancel'>
        <div className='u-heading--2'>Rename tab</div>
        <input type='text' value={renamingValue} onChange={e => setRenamingValue(e.target.value)} />
      </PopupConfirm>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onCreate={() => createTab()}
        onRemove={id => setTabToRemove(id)}
        onReorder={(id, newIndex) => reorderTab(id, newIndex)}
        onActivate={id => setActiveTab(id)}
        onContextMenu={(e, id) => handleContextMenu(e, id)}
        renderTabContent={renderTabContent}
        allowRemove
        allowCreate
        allowReorder
      />
    </>
  )
}

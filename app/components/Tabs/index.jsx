import React from 'react'

import { Icon } from '../Icon'

import './style.css'

/**
 * A tab widget
 * @param { params } param0
 * @returns { React.Component }
 */
export function Tabs ({
  tabs = [],
  activeTab,
  onActivate = () => {},
  onCreate = () => {},
  onReorder = () => {},
  onRemove = () => {},
  onContextMenu = () => {},
  renderTabContent = () => {},
  allowReorder = false,
  allowRemove = false,
  allowCreate = false
}) {
  const elRef = React.useRef()

  function clearDragOverClass () {
    const elements = elRef.current.querySelectorAll('.is-draggedOver')
    for (const element of elements) {
      element.classList.remove('is-draggedOver')
    }
  }

  function handleTabClick (i) {
    onActivate(i)
  }

  function handleTabClose (e, id) {
    e.stopPropagation()
    onRemove(id)
  }

  function handleTabDragOver (e) {
    e.preventDefault()
    clearDragOverClass()
    e.target.classList.add('is-draggedOver')
  }

  function handleTabDrop (e, i) {
    clearDragOverClass()

    const type = e.dataTransfer.getData('__type')
    if (type !== 'tab') {
      return
    }

    const id = e.dataTransfer.getData('id')
    onReorder(id, i)
    onActivate(id)
  }

  function handleTabDragStart (e, id) {
    e.dataTransfer.setData('id', id)
    e.dataTransfer.setData('__type', 'tab')
  }

  return (
    <>
    <div className='Tabs' ref={elRef}>
      <div className='Tabs-bar'>
        {
          (tabs || [])
            .map((tab, i) => {
              const isActive = tab.id === activeTab
              return (
                <div
                  key={i}
                  className={`Tabs-tab ${isActive ? 'is-active' : ''}`}
                  onDrop={e => handleTabDrop(e, i)}
                  onClick={() => handleTabClick(tab.id)}
                  onDragOver={e => handleTabDragOver(e)}
                  onDragStart={e => handleTabDragStart(e, tab.id)}
                  onContextMenu={e => onContextMenu(e, tab.id)}
                  draggable={allowReorder}
                  >
                  {
                    (tabs || []).length > 1 && allowRemove
                      ? (
                        <button
                          className='Tabs-tabCloseBtn'
                          onClick={e => handleTabClose(e, tab.id)}
                          >
                          <Icon name='close' />
                        </button>
                        )
                      : <></>
                  }
                  {tab.title || 'Untitled'}
                </div>
              )
            })
          }
          <div className='Tabs-actions'>
            {
              allowCreate && (
              <button className='Tabs-tabCreateBtn' onClick={() => onCreate()}>
                <Icon name='add' />
              </button>
              )
            }
          </div>
          <div
            className='Tabs-filler'
            onDragOver={e => handleTabDragOver(e)}
            onDrop={e => handleTabDrop(e, tabs?.length)}
          />
        </div>
        <div className='Tabs-content'>
          {
            /*
            Render the active tab
            */
            renderTabContent(activeTab)
          }
        </div>
      </div>
    </>
  )
}

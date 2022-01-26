import React from 'react'

import { PopupConfirm } from '../Popup/confirm'
import './style.css'

export function Tabs ({ data, onUpdate = () => {}, renderComponent = () => {} }) {
  const [activeTab, setActiveTab] = React.useState(0)
  const [tabToRemove, setTabToRemove] = React.useState()

  const children = Object
    .entries(data?.children) || []
    .filter(([, child]) => child)

  function handleTabClick (i) {
    setActiveTab(i)
  }

  function handleTabClose (e, id) {
    e.stopPropagation()
    setTabToRemove(id)
  }

  function handleConfirmChange (confirmed) {
    if (confirmed) {
      onUpdate({
        children: {
          [tabToRemove]: { $delete: true }
        }
      })
    }
    setTabToRemove(undefined)
  }

  function handleChildUpdate (id, child) {
    onUpdate({
      children: {
        [id]: child
      }
    })
  }

  return (
    <>
      <PopupConfirm open={tabToRemove} onChange={handleConfirmChange} confirmText='Close tab' abortText='Cancel'>
        <div className='u-heading--2'>Do you want to<br />close the tab?</div>
        Its layout will be erased
      </PopupConfirm>
      <div className='Tabs'>
        <div className='Tabs-bar'>
          {
            children
              .map(([id], i) => {
                const isActive = i === activeTab
                return (
                  <div key={id} className={`Tabs-tab ${isActive ? 'is-active' : ''}`} onClick={(e) => handleTabClick(i)}>
                    {
                      children.length > 1
                        ? <button className='Tabs-tabCloseBtn' onClick={e => handleTabClose(e, id)} />
                        : <></>
                    }
                    {id}
                  </div>
                )
              })
          }
        </div>
        <div className='Tabs-content'>
          {
            children[activeTab]
              ? renderComponent(children[activeTab][1], data => handleChildUpdate(children[activeTab][0], data))
              : <></>
          }
        </div>
      </div>
    </>
  )
}

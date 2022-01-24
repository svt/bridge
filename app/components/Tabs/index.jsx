import React from 'react'

import './style.css'

export function Tabs ({ data, onUpdate = () => {}, renderComponent = () => {} }) {
  const [activeTab, setActiveTab] = React.useState(0)

  const children = Object.entries(data?.children) || []

  function handleTabClick (i) {
    setActiveTab(i)
  }

  function handleChildUpdate (id, child) {
    onUpdate({
      children: {
        [id]: child
      }
    })
  }

  return (
    <div className='Tabs'>
      <div className='Tabs-bar'>
        {
          children
            .map(([id, child], i) => {
              const isActive = i === activeTab
              return (
                <div key={id} className={`Tabs-tab ${isActive ? 'is-active' : ''}`} onClick={() => handleTabClick(i)}>
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
  )
}

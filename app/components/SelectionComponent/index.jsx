import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

export const SelectionComponent = ({ onChange = () => {} }) => {
  const [shared] = React.useContext(SharedContext)
  const [selectedComponent, setSelectedComponent] = React.useState()

  function handleSelectChange (e) {
    const i = e.target.value
    const components = Object.values(shared.components || {})
    setSelectedComponent(components[i])
  }

  function handleButtonClick () {
    onChange({
      component: `${selectedComponent.bundle}.${selectedComponent.id}`,
      data: {
        id: selectedComponent.id,
        bundle: selectedComponent.bundle
      }
    })
  }

  return (
    <div className='SelectionComponent'>
      <div className='SelectionComponent-container'>
        <div className='SelectionComponent-heading'>Select a component</div>
        <select onChange={handleSelectChange}>
          <option disabled selected>Select component</option>
          {
            (shared.components ? Object.values(shared.components) : [])
              .map((component, i) => {
                return (
                  <option key={component.id} value={i}>
                    {component.name || component.id}
                  </option>
                )
              })
          }
        </select>
        <div className='SelectionComponent-buttonContainer'>
          <button className='Button--primary' onClick={handleButtonClick}>Change</button>
        </div>
      </div>
    </div>
  )
}

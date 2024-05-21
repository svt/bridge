import React from 'react'
import './style.css'

export const LogHeader = ({ data = {}, onChange = () => {} }) => {
  function handleDataChange (key, value) {
    onChange({
      ...data,
      [key]: value
    })
  }

  return (
    <header className='LogHeader'>
      <div className='LogHeader-setting'>
        <input type='checkbox' checked={data?.autoScroll || false} onChange={e => handleDataChange('autoScroll', e.target.checked)} />
        <div className='LogHeader-settingLabel'>Auto scroll</div>
      </div>
    </header>
  )
}

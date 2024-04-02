import React from 'react'
import './style.css'

export const TemplateDataHeader = ({ hasUnsavedChanges, onSave = () => {} }) => {
  if (!hasUnsavedChanges) {
    return <></>
  }

  return (
    <header className='TemplateDataHeader'>
      <div className='TemplateDataHeader-section'>
        Save changes
      </div>
      <div className='TemplateDataHeader-section'>
        <button className='Button Button--ghost' disabled={!hasUnsavedChanges} onClick={() => onSave()}>Save</button>
      </div>
    </header>
  )
}

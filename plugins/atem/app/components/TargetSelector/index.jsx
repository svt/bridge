import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

export const TargetSelector = ({ value = '__none', multipleValuesSelected = false, onChange = () => {} }) => {
  const [state] = React.useContext(SharedContext)
  const targets = state?.plugins?.[window.PLUGIN.name]?.targets || []

  return (
    <div className='TargetSelector'>
      <select className='Select--small' value={multipleValuesSelected ? '__multiple-values' : (value || '__none')} onChange={e => onChange(e.target.value)}>
        <option value='__none'>No target</option>
        {
          multipleValuesSelected &&
          <option value='__multiple-values' disabled>Multiple values</option>
        }
        {
          targets.map(target => {
            return <option key={target.id} value={target?.id}>{target?.name || 'Unnamed'}</option>
          })
        }
      </select>
    </div>
  )
}

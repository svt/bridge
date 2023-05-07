import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

export const ServerSelector = ({ value, multipleValuesSelected = false, onChange = () => {} }) => {
  const [state] = React.useContext(SharedContext)
  const servers = state?.plugins?.[window.PLUGIN.name]?.servers || []

  return (
    <div className='ServerSelector'>
      <select className='Select--small' value={multipleValuesSelected ? '__multiple-values' : value} onChange={e => onChange(e.target.value)}>
        <option value={undefined}>No server</option>
        {
          multipleValuesSelected &&
          <option value='__multiple-values' disabled>Multiple values</option>
        }
        {
          servers.map(server => {
            return <option key={server.id} value={server?.id}>{server?.name || 'Unnamed'}</option>
          })
        }
      </select>
    </div>
  )
}

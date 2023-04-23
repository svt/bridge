import React from 'react'
import './style.css'

import { ServerStatusBadge } from '../ServerStatusBadge'

export const ServerStatus = ({ server = {} }) => {
  return (
    <div className='ServerStatus'>
      <div>
        {server?.name}
      </div>
      <div>
        <ServerStatusBadge serverId={server.id} />
      </div>
    </div>
  )
}

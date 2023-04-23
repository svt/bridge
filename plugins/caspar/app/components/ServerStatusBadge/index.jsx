import React from 'react'

import { SharedContext } from '../../sharedContext'

import './style.css'

import disconnectedIcon from '../../assets/icons/disconnected.svg'
import connectedIcon from '../../assets/icons/connected.svg'
import errorIcon from '../../assets/icons/error.svg'

const ICON_MAPPING = {
  ERROR: errorIcon,
  CONNECTED: connectedIcon,
  CONNECTING: disconnectedIcon,
  DISCONNECTED: disconnectedIcon
}

const TEXT_MAPPING = {
  ERROR: 'Error',
  CONNECTED: 'Connected',
  CONNECTING: 'Connecting...',
  DISCONNECTED: 'Disconnected'
}

export const ServerStatusBadge = ({ serverId }) => {
  const [state] = React.useContext(SharedContext)
  const status = state?._tmp?.[window.PLUGIN.name]?.servers?.[serverId]?.status || 'DISCONNECTED'

  return (
    <div className='ServerStatusBadge'>
      <span className='ServerStatusBadge-icon' dangerouslySetInnerHTML={{ __html: ICON_MAPPING[status] }} />
      <span className='ServerStatusBadge-text'>{TEXT_MAPPING[status]}</span>
    </div>
  )
}

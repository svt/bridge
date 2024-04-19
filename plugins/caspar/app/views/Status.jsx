import React from 'react'

import { SharedContext } from '../sharedContext'
import { ServerStatus } from '../components/ServerStatus'

export const Status = () => {
  const [state] = React.useContext(SharedContext)
  const servers = state?.plugins?.[window.PLUGIN.name]?.servers || []

  return (
    <div className='u-scroll--y'>
      {
        (servers || []).map((server, i) => {
          return <ServerStatus key={i} server={server} />
        })
      }
    </div>
  )
}

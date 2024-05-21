import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { TargetInput } from '../components/TargetInput'

export const Devices = () => {
  const [state] = React.useContext(SharedContext)
  const devices = state?.plugins?.[window.PLUGIN.name]?.devices || []

  return (
    <div>
      {
        (devices || []).map(target => {
          return <TargetInput key={target.id} data={target} onChange={newData => handleChange(target.id, newData)} onDelete={() => handleDelete(target.id)} />
        })
      }
      <button className='Button' onClick={() => handleNew()}>New device</button>
    </div>
  )
}

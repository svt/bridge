import React from 'react'

import { StoreContext } from '../storeContext'
import { NoSelection } from '../components/NoSelection'

export function Inspector () {
  const [store] = React.useContext(StoreContext)

  return (
    <div className='View'>
      {
        !store?.selection?.length
          ? <NoSelection />
          : <div />
      }
    </div>
  )
}

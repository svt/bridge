import React from 'react'
import './style.css'

import bridge from 'bridge'

import * as utils from '../../utils'

export const Item = ({ data }) => {
  const [ id, [ type, remaining, duration, state ]] = data || []
  const [item, setItem] = React.useState()

  React.useEffect(() => {
    async function get () {
      const item = await bridge.items.getItem(id)
      setItem(item)
    }
    get()
  }, [id])

  return (
    <div className='Item'>
      <header className='Item-header'>
        <div>
          {item?.name}
        </div>
        <div>
          -{utils.msToTime(remaining + 1000)}
        </div>
      </header>
      <div className='Item-progress'>
        <div className='Item-progressFill' style={{ transform: `scale(${remaining / duration}, 1)` }} />
      </div>
    </div>
  )
}

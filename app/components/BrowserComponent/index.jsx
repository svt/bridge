import React from 'react'
import './style.css'

import { BrowserComponentHeader } from './BrowserComponentHeader'

export const BrowserComponent = ({ data = {}, onUpdate = () => {} }) => {
  return (
    <div className='BrowserComponent'>
      <div className='BrowserComponent-header'>
        <BrowserComponentHeader uri={data?.uri} onChange={newUri => onUpdate({ uri: newUri })} />
      </div>
      <div className='BrowserComponent-frameContainer'>
        {
          data?.uri &&
          <iframe className='BrowserComponent-frame' src={data?.uri} />
        }
      </div>
    </div>
  )
}

import React from 'react'
import './style.css'

import { BrowserComponentHeader } from './BrowserComponentHeader'

export const BrowserComponent = ({ data = {}, onUpdate = () => {} }) => {
  const [isLoading, setIsLoading] = React.useState(Boolean(data?.uri))

  React.useEffect(() => {
    setIsLoading(Boolean(data?.uri))
  }, [data?.uri])

  return (
    <div className='BrowserComponent'>
      <div className='BrowserComponent-header'>
        <BrowserComponentHeader uri={data?.uri} onChange={newUri => onUpdate({ uri: newUri })} />
      </div>
      {isLoading && <div className='BrowserComponent-loadingBar' />}
      <div className='BrowserComponent-frameContainer'>
        {
          data?.uri &&
          <iframe className='BrowserComponent-frame' src={data?.uri} onLoad={() => setIsLoading(false)} onError={() => setIsLoading(false)} />
        }
      </div>
    </div>
  )
}

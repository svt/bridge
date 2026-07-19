import React from 'react'
import './style.css'

import { BrowserComponentHeader } from './BrowserComponentHeader'

const BASE_HOST = `${window.location.protocol}//${window.location.host}`

export const BrowserComponent = ({ data = {}, onUpdate = () => {} }) => {
  const [isLoading, setIsLoading] = React.useState(Boolean(data?.uri))

  React.useEffect(() => {
    setIsLoading(Boolean(data?.uri))
  }, [data?.uri])

  return (
    <div className='BrowserComponent'>
      <div className='BrowserComponent-header'>
        <BrowserComponentHeader uri={data?.uri} onChange={newUri => onUpdate({ uri: newUri })} />
        {
          isLoading &&
          <div className='BrowserComponent-loadingBar' />
        }
      </div>
      <div className='BrowserComponent-frameContainer'>
        {
          data?.uri &&
          <iframe
            className='BrowserComponent-frame'
            src={`${BASE_HOST}/embed?url=${encodeURIComponent(data?.uri)}`}
            title={data?.uri}
            sandbox='allow-downloads allow-forms allow-modals allow-popups allow-presentation allow-scripts allow-same-origin'
            onLoad={() => setIsLoading(false)}
          />
        }
      </div>
    </div>
  )
}

<iframe allow="autoplay *; encrypted-media *;" frameborder="0" height="150" style="width:100%;max-width:660px;overflow:hidden;background:transparent;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="https://embed.music.apple.com/se/album/levitating-live-from-mexico/6772178540?i=6772178817"></iframe>

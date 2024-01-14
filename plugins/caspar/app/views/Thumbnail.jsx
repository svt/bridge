import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { ThumbnailImage } from '../components/ThumbnailImage'

export const Thumbnail = () => {
  const [state] = React.useContext(SharedContext)
  const [item, setItem] = React.useState({})
  const [image, setImage] = React.useState()
  const [selection, setSelection] = React.useState([])

  React.useEffect(() => {
    const selection = state?._connections?.[bridge.client.getIdentity()]?.selection
    setSelection(selection)
  }, [state])

  React.useEffect(() => {
    async function getItem () {
      if (!selection || selection.length < 1) {
        setImage(undefined)
        setItem(undefined)
        return
      }
      const item = await bridge.items.getItem(selection[0])

      if (item?.type !== 'bridge.caspar.media') {
        setImage(undefined)
        setItem(undefined)
        return
      }

      if (!item?.data?.caspar?.server || !item?.data?.caspar?.target) {
        setImage(undefined)
        setItem(undefined)
        return
      }

      try {
        const res = await bridge.commands.executeCommand('caspar.sendCommand', item?.data?.caspar?.server, 'thumbnailRetrieve', item?.data?.caspar?.target)
        const src = (res?.data || []).join('')
        setImage(`data:image/png;base64,${src}`)
        setItem(item)
      } catch (_) {
        setImage(undefined)
        setItem(undefined)
      }
    }
    getItem()
  }, [selection])

  return (
    <ThumbnailImage src={image} alt={item?.name} />
  )
}

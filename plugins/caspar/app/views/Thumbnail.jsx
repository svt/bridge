import React from 'react'
import bridge from 'bridge'

import { ThumbnailImage } from '../components/ThumbnailImage'

export const Thumbnail = () => {
  const [item, setItem] = React.useState({})
  const [image, setImage] = React.useState()
  const [selection, setSelection] = React.useState([])

  React.useEffect(() => {
    async function onSelectionChange (selection) {
      setSelection(selection)
    }
    
    bridge.events.on('selection', onSelectionChange)
    return () => bridge.events.off('selection', onSelectionChange)
  }, [])

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
        /*
        Find a server to query by first checking if the provided server is a group
        and assume that the first server in that group has the asset,
        otherwise fall back to using the id directly from the item
        */
        const servers = await bridge.commands.executeCommand('caspar.listServersInGroup', item?.data?.caspar?.server || '')
        const serverId = servers[0]?.id || item?.data?.caspar?.server

        const res = await bridge.commands.executeCommand('caspar.sendCommand', serverId, 'thumbnailRetrieve', item?.data?.caspar?.target)
        const src = (res?.data || []).join('')
        setImage(`data:image/png;base64,${src}`)
        setItem(item)
      } catch (e) {
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

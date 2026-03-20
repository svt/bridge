import React from 'react'
import bridge from 'bridge'
import { SharedContext } from '../sharedContext'
import { MediaSeek } from '../components/MediaSeek'

export const InspectorRange = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])

  // Fetch selection when state changes
  React.useEffect(() => {
    async function updateSelection() {
      const sel = await bridge.client.selection.getSelection()
      setSelection(sel)
    }
    updateSelection()
  }, [state, state?.items[0]?.data?.caspar?.seek, state?.items[0]?.data?.duration])
 

  const items = selection.map(id => state?.items?.[id])
  const item = items[0]
  if (!item) return null

  // Only allow seek for one item at a time
  if (items.length > 1) {
    return (
      <div className="View--spread">
        <p>Multiple items selected</p>
      </div>
    )
  }

  // Get parameters from the first selected item
  const medialength = item?.data?.medialength
  // Don't show seek bar if length is 0
  if (medialength === 0) return null

  const seek = Number.parseInt(item?.data?.caspar?.seek) || 0
  const length = item?.data?.caspar?.length === undefined
    ? (medialength - seek) 
    : item?.data?.caspar?.length  

  const framerate = item?.data?.framerate || 25

  // Convert frames to milliseconds
  const inValue = seek / framerate * 1000
  const outValue = (length+seek) / framerate * 1000
  const maxValue = medialength / framerate * 1000

  function handleChange (newIn, newOut) {
    for (const id of selection) {

      const item = state?.items?.[id]
      const framerate = item?.data?.framerate || 25

      // newIn and newOut are in milliseconds
      const seekFrames = Math.round((newIn / 1000) * framerate) // frames
      const lengthFrames = Math.round(((newOut - newIn) / 1000) * framerate) // frames
      const duration = Math.round(newOut - newIn) // milliseconds

      bridge.items.applyItem(id, {
        data: {
          caspar: {
            seek: seekFrames,
            length: lengthFrames
          },
          duration
        }
      })
    }
  }

  return (
    <div className="View--spread">
      <MediaSeek
        inValue={inValue}
        outValue={outValue}
        maxValue={maxValue}
        onChange={handleChange}
      />
    </div>
  )
}

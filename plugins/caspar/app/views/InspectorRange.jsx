import React from 'react'
import bridge from 'bridge'
import { SharedContext } from '../sharedContext'
import { MediaSeek } from '../components/MediaSeek'
import { framesToMilliseconds, millisecondsToFrames} from '../utils/asset.cjs'

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
  }, [state])
 

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
  const framerate = item?.data?.framerate || 25
  const medialength = item?.data?.medialength || millisecondsToFrames(item?.data?.duration, framerate)
  // Don't show seek bar if length is 0
  if (medialength === 0) return null

  const seek = Number.parseInt(item?.data?.caspar?.seek) || 0
  const length = item?.data?.caspar?.length || (medialength - seek)

  // Convert frames to milliseconds
  const inValue = framesToMilliseconds(seek, framerate)
  const outValue = framesToMilliseconds(seek + length, framerate)
  const maxValue = framesToMilliseconds(medialength, framerate)

  function handleChange (newIn, newOut) {
    const id = selection[0]
    const item = state?.items?.[id]
    const framerate = item?.data?.framerate || 25

    // newIn and newOut are in milliseconds
    const seekFrames = millisecondsToFrames(newIn, framerate) // frames
    const lengthFrames = millisecondsToFrames(newOut - newIn, framerate) // frames
    const duration = Math.round(newOut - newIn) // milliseconds

    bridge.items.applyItem(id, {
      data: {
        caspar: {
          seek: seekFrames,
          length: lengthFrames
        },
        duration: duration
      }
    })
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

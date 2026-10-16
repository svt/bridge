import React from 'react'
import bridge from 'bridge'

/*
SVG is left out since it can contain scripts
when opened directly from the web server
*/
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']

export default function App () {
  const [fileId, setFileId] = React.useState(window.WIDGET_DATA?.fileId)
  const [isDragging, setIsDragging] = React.useState(false)
  const [error, setError] = React.useState()

  async function handleDrop (e) {
    e.preventDefault()
    setIsDragging(false)

    const file = Array.from(e.dataTransfer.files).find(file => ACCEPTED_TYPES.includes(file.type))
    if (!file) {
      setError('Only PNG, JPEG, GIF, WebP and AVIF images are supported')
      return
    }

    setError()

    try {
      const uploaded = await bridge.files.upload(file)

      /*
      Remove the previous upload, unless the
      same image was dropped again as files
      are stored by their content
      */
      if (fileId && fileId !== uploaded.id) {
        await bridge.files.delete(fileId)
      }

      setFileId(uploaded.id)
      window.WIDGET_UPDATE?.({ fileId: uploaded.id })
    } catch (err) {
      setError(err.message)
    }
  }

  function handleDragOver (e) {
    e.preventDefault()
    setIsDragging(true)
  }

  return (
    <div
      className={`ImageWidget${isDragging ? ' ImageWidget--dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {
        fileId
          ? <img className='ImageWidget-image' src={bridge.files.getUrl(fileId)} draggable={false} />
          : <div className='ImageWidget-hint'>Drop an image here</div>
      }
      { error && <div className='ImageWidget-error'>{error}</div> }
    </div>
  )
}

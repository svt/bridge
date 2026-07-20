
import React from 'react'
import './BrowserComponentHeader.css'

export const BrowserComponentHeader = ({ uri, onChange = () => {} }) => {
  const [draftUri, setDraftUri] = React.useState(uri || '')

  React.useEffect(() => {
    setDraftUri(uri || '')
  }, [uri])

  function normalizeUri (value) {
    const trimmedValue = value.trim()

    if (!trimmedValue) {
      return ''
    }

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedValue)) {
      return trimmedValue
    }

    return `https://${trimmedValue}`
  }

  function handleSubmit (e) {
    e.preventDefault()
    onChange(normalizeUri(draftUri))
  }

  return (
    <form className='BrowserComponentHeader' onSubmit={handleSubmit}>
      <div className='BrowserComponentHeader-section BrowserComponentHeader-section--address'>
        <input
          className='BrowserComponentHeader-addressInput Input'
          type='text'
          value={draftUri}
          placeholder='Enter a URL'
          onChange={e => setDraftUri(e.target.value)}
        />
      </div>
      <div className='BrowserComponentHeader-section'>
        <button className='Button Button--secondary' type='submit'>Go</button>
      </div>
    </form>
  )
}

import React from 'react'
import './style.css'

import integrations from './integrations'

export const Palette = ({ open, onClose = () => {} }) => {
  const inputRef = React.useRef()
  const [result, setResult] = React.useState([])

  /**
   * Collect results from
   * all integrations
   * on input
   * 
   * This function will update
   * the state 'result'
   * 
   * @param { String } input 
   * @returns 
   */
  async function handleInput (input) {
    if (input === '') {
      setResult([])
      return
    }

    const newResult = []
    for (const integration of integrations) {
      newResult.push({
        label: integration.label,
        rows: await integration.get({ query: input })
      })
    }
    setResult(newResult)
  }

  /*
  Reset and focus the input
  whenever the palette is opened
  */
  React.useEffect(() => {
    if (!open) return
    inputRef.current.value = ''
    inputRef.current.focus()
  }, [open])

  /*
  Close the palette
  using the escape key
  */
  React.useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown (e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return <></>
  }

  return (
    <div className='Palette'>
      <div className='Palette-backdrop' onClick={() => onClose()} onContextMenu={() => onClose()} />
      <div className='Palette-input'>
        <input ref={inputRef} type='text' onChange={e => handleInput(e.target.value)} placeholder='Press ESC to close the palette' />
        {
          /*
          Render all integrations one by one
          if there are results to render
          */
          result.length
          ? (
              <div className='Palette-result'>
                {
                  /*
                  Filter out integrations that
                  didn't return any results
                  */
                  result
                    .filter(({ rows }) => rows.length)
                    .map(({ label, rows }) => {
                      return (
                        <div key={label} className='Palette-resultSection'>
                          <label className='Palette-resultLabel u-text--label'>{label}</label>
                          {
                            rows.map((row, i) => <div key={`${label}:${i}`} className='Palette-row' onClick={() => onClose()}>{row}</div>)
                          }
                        </div>
                      )
                    })
                }
              </div>
            )
          : <></>
        }
      </div>
    </div>
  )
}

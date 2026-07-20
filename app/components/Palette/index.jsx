import React from 'react'
import { createPortal } from 'react-dom'

import './style.css'

import integrations from './integrations'
import { Icon } from '../Icon'

export const Palette = ({ title, open, onOpen = () => {}, onClose = () => {} }) => {
  const elRef = React.useRef()
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
  whenever the palette is
  opened or closed
  */
  React.useEffect(() => {
    inputRef.current.value = ''
    if (open) {
      inputRef.current.focus()
    }
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

  function select (currentEl, direction) {
    let nextTarget
    const items = Array.from(elRef.current.querySelectorAll('.is-selectable'))

    /*
    Select the first row if the
    current element is not in the set
    */
    if (currentEl.className.indexOf('is-selectable') === -1) {
      items[0].focus()
      return
    }

    const index = items.findIndex(el => el === currentEl)

    if (direction < 0) {
      const nextIndex = index - 1

      /*
      Select the last item if we're
      at the top of the list
      */
      if (nextIndex < 0) {
        nextTarget = items[items.length - 1]
      } else {
        nextTarget = items[nextIndex]
      }
    }

    if (direction > 0) {
      const nextIndex = index + 1

      /*
      Select the first item if we're
      at the end of the list
      */
      if (nextIndex > items.length - 1) {
        nextTarget = items[0]
      } else {
        nextTarget = items[nextIndex]
      }
    }

    if (!nextTarget) {
      return
    }

    nextTarget.focus()
  }

  function handleRowKeyDown (e) {
    switch (e.key) {
      /*
      Click all children
      when enter is pressed
      */
      case 'Enter':
        for (const child of e.target.children) {
          child.click()
        }
        break
      case 'ArrowDown':
        select(e.target, 1)
        break
      case 'ArrowUp':
        select(e.target, -1)
        break
    }
  }

  function handleInputKeyDown (e) {
    switch (e.key) {
      /*
      Override arrow up and arrow down
      for the input element to
      select rows rather than
      its text content,

      and override escape
      to close the palette
      */
      case 'ArrowDown':
        e.preventDefault()
        select(e.target, 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        select(e.target, -1)
        break
      case 'Escape':
        e.preventDefault()
        inputRef.current?.blur()
        onClose()
        break
    }
  }

  return (
    <div ref={elRef} className='Palette'>
      {
        open &&
        createPortal(
          <div className='Palette-backdrop' onClick={() => onClose()} onContextMenu={() => onClose()} />,
          document.body
        )
      }
      <div className={`Palette-input ${open ? 'is-open' : ''} ${result.length ? 'has-results' : ''}`}>
        <div className='Palette-icon'>
          <Icon name='search' />
        </div>
        <input
          ref={inputRef}
          type='text'
          className='is-selectable'
          onKeyDown={e => handleInputKeyDown(e)}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => onOpen()}
          placeholder={title || ''}
        />
        {
          /*
          Render all integrations one by one
          if there are results to render
          */
          (open && result.length)
          ? (
              <div className='Palette-result'>
                {
                  /*
                  Filter out integrations that
                  didn't return any results
                  */
                  result
                    .filter(({ rows }) => rows.length)
                    .flatMap(({ label, rows }) => {
                      return ([
                          <label key={label} className='Palette-resultLabel u-text--label'>{label}</label>,
                          rows.flatMap((row, i) => {
                            return (
                              <div
                                key={`${label}:${i}`}
                                className='Palette-row is-selectable'
                                onClick={() => onClose()}
                                onKeyDown={e => handleRowKeyDown(e)}
                                tabIndex={0}
                              >
                                {row}
                              </div>
                            )
                          })
                        ]
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

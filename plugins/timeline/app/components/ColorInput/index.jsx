/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'

import './style.css'

import { HexColorPicker, HexColorInput } from 'react-colorful'

const MAX_RECENT_COLORS_COUNT = 14

export function ColorInput ({
  className = '',
  value = '',
  recentColors = [],
  onChange = () => {},
  onChangeRecent = () => {}
}) {
  const [didChange, setDidChange] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState()

  const elRef = React.useRef()

  /**
   * Add a color to the
   * list of recent colors
   * @param { String[] } currentRecentColors
   * @param { String } color
   */
  function addToRecent (currentRecentColors = [], newColor) {
    const newRecentColorsArray = [...currentRecentColors]

    /*
    If the color is already in the array,
    remove it to add it again at index 0
    */
    const indexOfColor = newRecentColorsArray.indexOf(newColor)
    if (indexOfColor > -1) {
      newRecentColorsArray.splice(indexOfColor, 1)
    }

    newRecentColorsArray.unshift(newColor)

    /*
    Make sure that there are no more than
    the max number of colors in the array
    */
    if (newRecentColorsArray.length > MAX_RECENT_COLORS_COUNT) {
      newRecentColorsArray.pop()
    }

    onChangeRecent(newRecentColorsArray)
  }

  function handleChange (color) {
    onChange(color)
    setDidChange(true)
  }

  function handleClick () {
    setIsOpen(!isOpen)
  }

  function handleKeyDown (e, color) {
    if (e.key === 'Enter') {
      handleChange(color)
    }
  }

  React.useEffect(() => {
    /**
     * Close the color picker if a click
     * was made outside of the element
     * @param { PointerEvent } e
     */
    function handleWindowClick (e) {
      if (e.composedPath().includes(elRef.current)) {
        return
      }
      setIsOpen(false)
    }

    window.addEventListener('click', handleWindowClick)
    return () => window.removeEventListener('click', handleWindowClick)
  }, [])

  /*
  Close the color picker if the
  widget loses focus
  */
  React.useEffect(() => {
    function handleClose () {
      setIsOpen(false)
    }
    window.addEventListener('blur', handleClose)
    return () => window.removeEventListener('blur', handleClose)
  }, [])

  /*
  Whenever the popover is closed,
  add its color to recents if it was
  changed from when the popover was
  opened
  */
  React.useEffect(() => {
    if (isOpen) return
    if (!didChange) return
    addToRecent(recentColors, value)
    setDidChange(false)
  }, [isOpen])

  return (
    <div ref={elRef} className={`ColorInput ${className}`}>
      <button
        className='ColorInput-button'
        style={{ backgroundColor: value }}
        onClick={() => handleClick()}
      />
      {
        isOpen
          ? (
            <div className='ColorInput-popover'>
              <HexColorPicker color={value} onChange={handleChange} />
              <div className='ColorInput-section'>
                <label className='ColorInput-label'>HEX</label>
                <span className='ColorInput-hash'>#</span>
                <HexColorInput className='ColorInput-hexInput' color={value} onChange={handleChange} />
              </div>
              {
                recentColors.length > 0
                  ? (
                    <div className='ColorInput-section'>
                      <label className='ColorInput-label'>Recent</label>
                      {
                        recentColors.map((color, i) => (
                          <div
                            key={i}
                            role='button'
                            tabIndex={0}
                            className='ColorInput-recentColor'
                            style={{ background: color }}
                            onClick={() => handleChange(color)}
                            onKeyDown={(e) => handleKeyDown(e, color)}
                          />
                        ))
                      }
                    </div>
                    )
                  : <></>
              }
            </div>
            )
          : <></>
      }
    </div>
  )
}

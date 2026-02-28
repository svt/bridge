/*
 * SPDX-FileCopyrightText: 2026 Axel Boberg
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

import { ShortcutInput } from '../../../../../app/components/ShortcutInput'

const SHORTCUT_DELIMITER = '+'

export function InspectorShortcutInput ({
  value = '',
  onChange = () => {}
}) {
  const [isCapturing, setIsCapturing] = React.useState()
  const [arrValue, setArrValue] = React.useState([])

  React.useEffect(() => {
    setArrValue(String(value).split(SHORTCUT_DELIMITER))
  }, [value])

  function handleTriggerChange (newTrigger) {
    onChange(newTrigger.join(SHORTCUT_DELIMITER))
  }

  function handleToggleCapture () {
    setIsCapturing(current => !current)
  }

  return (
    <div className='InspectorShortcutInput'>
      <ShortcutInput disabled={!isCapturing} trigger={arrValue} onChange={newTrigger => handleTriggerChange(newTrigger)} />
      <div className='InspectorShortcutInput-button'>
        <button className='Button' onClick={() => handleToggleCapture()}>
          {
            isCapturing
              ? 'Stop capturing'
              : 'Capture'
          }
        </button>
      </div>
    </div>
  )
}

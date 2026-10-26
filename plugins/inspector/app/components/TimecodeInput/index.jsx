/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState } from 'react'
import './style.css'

const LABELS = ['H', 'M', 'S', 'F']

function parse (value) {
  const digits = String(value || '').split(/[^0-9]+/).filter(Boolean)
  return LABELS.map((_, i) => (digits[i] || '').slice(0, 2).padStart(2, '0'))
}

function format (parts) {
  return parts.map(p => p.padStart(2, '0')).join(':')
}

export function TimecodeInput ({
  value = '',
  onChange = () => {},
  onKeyDown = () => {},
  large
}) {
  const [parts, setParts] = useState(() => parse(value))
  const refs = useRef([])
  const lastEmitted = useRef(null)

  // Sync external changes, ignoring echoes of our own output
  useEffect(() => {
    if (value === lastEmitted.current) return
    setParts(parse(value))
  }, [value])

  function update (next) {
    setParts(next)
    const out = format(next)
    lastEmitted.current = out
    onChange(out)
  }

  function focus (index, selectAll = true) {
    const el = refs.current[index]
    if (!el) return
    el.focus()
    if (selectAll) el.select()
  }

  function handleChange (index, raw) {
    const digits = raw.replace(/\D/g, '')
    const next = [...parts]
    next[index] = digits.slice(-2)
    update(next)

    if (next[index].length === 2 && index < LABELS.length - 1) {
      focus(index + 1)
    }
  }

  function handleKeyDown (index, e) {
    const el = e.target
    const atStart = el.selectionStart === 0 && el.selectionEnd === 0
    const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length

    if (/^[:;.,]$/.test(e.key)) {
      e.preventDefault()
      if (index < LABELS.length - 1) focus(index + 1)
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
        if (atStart && index > 0) {
          e.preventDefault()
          focus(index - 1)
        }
        return
      case 'ArrowRight':
        if (atEnd && index < LABELS.length - 1) {
          e.preventDefault()
          focus(index + 1)
        }
        return
      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault()
        const delta = e.key === 'ArrowUp' ? 1 : -1
        const next = [...parts]
        next[index] = String(Math.max(0, (parseInt(parts[index], 10) || 0) + delta)).padStart(2, '0').slice(-2)
        update(next)
        return
      }
      case 'Backspace':
        if (atStart && index > 0) {
          e.preventDefault()
          focus(index - 1)
          return
        }
        break
      default:
    }
    onKeyDown(e)
  }

  function handlePaste (e) {
    const text = e.clipboardData.getData('text')
    if (!/\d/.test(text)) return
    e.preventDefault()

    if (/\D/.test(text.trim())) {
      update(parse(text))
    } else {
      // Plain digits fill right-aligned, e.g. 1020 -> 00:00:10:20
      const digits = text.trim().slice(-8).padStart(8, '0')
      update(digits.match(/../g))
    }
    focus(LABELS.length - 1, false)
  }

  return (
    <div className={`TimecodeInput ${large ? 'TimecodeInput--large' : ''}`} onPaste={handlePaste}>
      {LABELS.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className='TimecodeInput-separator'>:</span>}
          <label className='TimecodeInput-part'>
            <input
              ref={el => { refs.current[i] = el }}
              type='text'
              inputMode='numeric'
              maxLength={2}
              className='TimecodeInput-field'
              value={parts[i]}
              aria-label={label}
              onFocus={e => e.target.select()}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
            />
            <span className='TimecodeInput-label'>{label}</span>
          </label>
        </React.Fragment>
      ))}
    </div>
  )
}

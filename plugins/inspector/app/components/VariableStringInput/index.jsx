/*
 * SPDX-FileCopyrightText: 2024 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

import { StringInput } from '../StringInput'

const VARIABLE_REGEX = /\$\(/g

function stringEndsWithUnclosedVariable (str) {
  if (!str) {
    return false
  }
  const parts = `${str}`.split(VARIABLE_REGEX)
  const lastPart = parts[parts.length - 1]
  return lastPart.indexOf(')') === -1 && parts.length > 1
}

function getLastUnfinishedVariable (str) {
  const parts = str.split(VARIABLE_REGEX)
  return parts[parts.length - 1]
}

function getCompletion (str, completions) {
  const matches = completions
    .filter(completion => completion.indexOf(str) === 0)
    .sort((a, b) => a.length - b.length)

  return matches[0]
}

/**
 * Get all possible paths to
 * leaves from an object in
 * dot-notation
 * 
 * @param { Object } obj 
 * @returns { String[] }
 */
function getPathsFromObject (obj) {
  if (!obj || typeof obj !== 'object') {
    return []
  }

  const out = []
  for (const key of Object.keys(obj)) {
    out.push(key)

    if (typeof obj[key] === 'object') {
      const subpaths = getPathsFromObject(obj[key])
        .map(subpath => `${key}.${subpath}`)
      out.push(...subpaths)
    }
  }
  return out
}

export function VariableStringInput ({
  htmlFor,
  value = '',
  onChange = () => {},
  variableContext = {},
  large
}) {
  const [suggestion, setSuggestion] = React.useState()
  const paths = React.useMemo(() => {
    return getPathsFromObject(variableContext)
  }, [variableContext])

  React.useEffect(() => {
    if (!stringEndsWithUnclosedVariable(value)) {
      setSuggestion('')
      return
    }

    const lastUnfinishedVariable = getLastUnfinishedVariable(value)
    const suggestion = getCompletion(lastUnfinishedVariable, paths)

    if (!suggestion) {
      setSuggestion('')
      return
    }

    setSuggestion(suggestion.substring(lastUnfinishedVariable.length))
  }, [value, paths])

  function handleKeyDown (e) {
    if (!suggestion) {
      return
    }
    if (e.key === 'ArrowRight' || e.key === 'Tab') {
      e.preventDefault()
      onChange(value += suggestion)
    }
  }

  return (
    <div className='VariableStringInput'>
      <div className='VariableStringInput-suggestion'>{value}{suggestion}</div>
      <StringInput
        htmlFor={htmlFor}
        value={value}
        onChange={newValue => onChange(newValue)}
        onKeyDown={e => handleKeyDown(e)}
        large={large}
      />
    </div>
  )
}

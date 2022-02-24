{/*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/}

import React from 'react'
import './style.css'

function zeroPad (num) {
  if (num < 10) return `0${num}`
  return `${num}`
}

/**
 * Wrap every character
 * of a string in a span
 * @param { String } str
 * @returns { React.ReactElement[] }
 */
function spanWrapCharacters (str = '') {
  return String(str)
    .split('')
    .map((char, i) => <span key={i} className='CurrentTime-char'>{char}</span>)
}

export const CurrentTime = ({ className = '', offset = 0, base = Date.now() }) => {
  const [milliseconds, setMilliseconds] = React.useState(0)

  React.useEffect(() => {
    const start = Date.now()
    const ival = window.setInterval(() => {
      setMilliseconds(Date.now() - start)
    }, 30)

    setMilliseconds(0)
    return () => {
      clearInterval(ival)
    }
  }, [base])

  const time = base + offset + milliseconds
  const date = new Date(time)

  const hours = zeroPad(date.getHours())
  const minutes = zeroPad(date.getMinutes())
  const seconds = zeroPad(date.getSeconds())
  const hundreds = Math.floor(date.getMilliseconds() / 100)

  return (
    <span className={className}>
      {spanWrapCharacters(hours)}:{spanWrapCharacters(minutes)}:{spanWrapCharacters(seconds)}<span className='CurrentTime-faded'>.{spanWrapCharacters(hundreds)}</span>
    </span>
  )
}

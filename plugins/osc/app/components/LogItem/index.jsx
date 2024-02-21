import React from 'react'
import './style.css'

function zeroPad (n, magnitude = 10) {
  if (n < magnitude) {
    return `0${n}`
  }
  return `${n}`
}

function formatTime (ms) {
  const d = new Date(ms)
  return `${zeroPad(d.getHours())}:${zeroPad(d.getMinutes())}:${zeroPad(d.getSeconds())}.${zeroPad(zeroPad(d.getMilliseconds()), 100)}`
}

export const LogItem = ({ item = {} }) => {
  return (
    <div className='LogItem' data-direction={item?.direction}>
      <div className='LogItem-timestamp'>{formatTime(item?.timestamp)}</div>
      <div className='LogItem-direction'>| {item?.direction === 'in' ? '>>' : '<<'}</div>
      <div className='LogItem-address'>{item?.address}</div>
    </div>
  )
}

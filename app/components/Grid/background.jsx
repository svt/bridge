import React from 'react'
import './background.css'

export function GridBackground ({ cols = 1, rows = 1}) {
  return (
    <div className='Grid-background'>
      {
        Array(cols).fill(undefined).map(i => {
          return (
            <div key={i} className='Grid-backgroundCol'>
              {
                Array(rows).fill(undefined).map(j => {
                  return <div key={`${i}:${j}`} className='Grid-backgroundRow' />
                })
              }
            </div>
          )
        })
      }
    </div>
  )
}
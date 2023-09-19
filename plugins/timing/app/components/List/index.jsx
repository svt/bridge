import React from 'react'
import './style.css'

export const List = ({ children = [] }) => {
  return (
    <ol className='List'>
      {
        children.map((child, i) => {
          return (
            <li key={i}>
              { child }
            </li>
          )
        })
      }
    </ol>
  )
}

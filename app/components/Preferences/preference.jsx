import React from 'react'

import './preference.css'

export function Preference ({ children, title, description }) {
  return (
    <div className='Preferences-preference'>
      {
        title
          ? <h3 className='Preferences-preferenceTitle'>{title}</h3>
          : <></>
      }
      {
        description
          ? (
            <label className='Preferences-preferenceDescription'>
              {description}
            </label>
            )
          : <></>
      }
      {children}
    </div>
  )
}

import React from 'react'
import './style.css'

import icon from '../../assets/icons/warning.svg'

export const MissingComponent = ({ data = {} }) => {
  return (
    <div className='MissingComponent'>
      <div className='MissingComponent-container'>
        <div dangerouslySetInnerHTML={{ __html: icon }} />
        <div className='MissingComponent-heading'>Missing or crashing widget</div>
        {data.component}
      </div>
    </div>
  )
}

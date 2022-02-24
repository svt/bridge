{/*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/}

import React from 'react'
import './style.css'

import icon from '../../assets/icons/warning.svg'

export const MissingComponent = ({ data = {} }) => {
  return (
    <div className='MissingComponent'>
      <div className='MissingComponent-container'>
        <img src={icon} width={32} alt='Icon of a warning sign' />
        <div className='MissingComponent-heading'>Missing plugin</div>
        {data.component}
      </div>
    </div>
  )
}

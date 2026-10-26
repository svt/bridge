import React from 'react'
import './style.css'

import tinycolor from 'tinycolor2'

import { Icon } from '../../../../../app/components/Icon'

const COLOR_CONTRAST_THRESHOLD = 2

function getBackgroundColor () {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--base-color--background1')
    .trim()
}

export const ItemButton = ({ icon, label, color, onClick = () => {} }) => {
  const [textColor, setTextColor] = React.useState('var(--base-color)')

  React.useEffect(() => {
    const contrast = tinycolor.readability(tinycolor(getBackgroundColor()), tinycolor(color))
    if (contrast < COLOR_CONTRAST_THRESHOLD) {
      setTextColor('var(--base-color)')
    } else {
      setTextColor(color)
    }
  }, [color])

  return (
    <button className='ItemButton' onClick={() => onClick()} style={{ color: textColor }}>
      {
        icon && color &&
        (
          <span className='ItemButton-icon'>
            <Icon name={icon} color={textColor} />
          </span>
        )
      }
      { label }
      <div className='ItemButton-background' style={{ backgroundColor: color || 'transparent' }} />
    </button>
  )
}

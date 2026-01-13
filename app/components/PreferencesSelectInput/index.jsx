import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesSelectInput ({ label, value, options = [], onChange = () => {} }) {
  const [id] = React.useState(`number-${random.number()}`)
  return (
    <div className='PreferencesSelectInput'>
      <label htmlFor={id}>{label}</label><br/>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}>
        {
          options.map((option, i) => {
            let label = option
            let id = i

            /*
            Allow for using a custom id
            if the option is an object
            containing the keys 'id' and 'label'
            */
            if (typeof option === 'object' && option?.id) {
              label = option.label
              id = option.id
            }

            return <option key={i} value={id}>{label}</option>
          })
        }
      </select>
    </div>
  )
}

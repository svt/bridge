import React from 'react'
import './style.css'

export const Select = ({ children, values = [], defaultValue, onChange = () => {} }) => {
  const isMultipleSelected = React.useMemo(() => {
    const set = new Set()
    for (const value of values) {
      set.add(value)
    }
    return set.size > 1
  }, [values])

  return (
    <select className='Select Select--small' value={isMultipleSelected ? '__multiple-values' : (values[0] || defaultValue)} onChange={e => onChange(e.target.value)}>
      {
        isMultipleSelected &&
        <option value='__multiple-values' disabled>Multiple values</option>
      }
      { children }
    </select>
  )
}

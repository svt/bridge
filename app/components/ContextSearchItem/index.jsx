import React from 'react'
import './style.css'

import { ContextMenuDivider } from '../ContextMenuDivider'

function flattenSpec (spec, parentLabel) {
  const out = []
  for (const item of spec) {
    if (typeof item !== 'object') {
      continue
    }
  
    let newLabel = item?.label
    if (parentLabel) {
      newLabel = `${parentLabel} > ${item?.label}`
    }

    out.push({
      ...item,
      label: newLabel,
      children: undefined
    })

    if (Array.isArray(item.children)) {
      out.push(...flattenSpec(item.children, newLabel))
    }
  }
  return out
}

export const ContextMenuSearchItem = ({ spec = [], onSearch = () => {} }) => {
  const flattened = React.useMemo(() => {
    return flattenSpec(spec)
  }, [spec])

  function handleChange (e) {
    const query = (e.target.value || '').toLowerCase()

    if (!query) {
      onSearch(spec)
      return
    }

    const newSpec = flattened
      .filter(item => item?.onClick)
      .filter(item => {
        return (item?.label || '').toLowerCase().indexOf(query) > -1
      })
    onSearch(newSpec)
  }

  return (
    <>
      <div
        className='ContextMenuItem ContextMenuSearchItem'
      >
        <input
          type='search'
          className='ContextMenuSearchItem-input'
          onChange={e => handleChange(e)}
          placeholder='&#xe900; Search'
          autoFocus
        />
      </div>
      <ContextMenuDivider />
    </>
  )
}

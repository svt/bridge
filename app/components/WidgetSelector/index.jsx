import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

function normalize (str) {
  return String(str)
    .toLowerCase()
    .replace(/\s/g, '')
}
export function WidgetSelector ({ value, onClose = () => {}, onChange = () => {} }) {
  const [shared] = React.useContext(SharedContext)

  const [query, setQuery] = React.useState()
  const [widgets, setWidgets] = React.useState([])

  React.useEffect(() => {
    const normalizedQuery = normalize(query || '')

    /*
    Filter widgets against the query
    as a simple search function
    */
    const widgets = Object.values(shared?._widgets || {})
      .filter(widget => {
        if (!query) {
          return true
        }
        if (normalize(widget.id || '').includes(normalizedQuery)) {
          return true
        }
        if (normalize(widget.name || '').includes(normalizedQuery)) {
          return true
        }
        return false
      })

    setWidgets(widgets)
  }, [query, shared?._widgets])

  function handleSelect (id) {
    onChange({ component: id })
  }

  function handleClose () {
    setQuery('')
    onClose()
  }

  return (
    <div className='WidgetSelector'>
      <header className='WidgetSelector-header'>
        <input type='search' className='WidgetSelector-search' value={query} placeholder='&#xe900; Search widgets' onChange={e => setQuery(e.target.value)} />
      </header>
      <div className='WidgetSelector-list'>
        {
          (widgets || []).map(widget => {
            return (
              <div key={widget.id} className='WidgetSelector-listItem' tabIndex={0} onClick={() => handleSelect(widget.id)}>
                <div className='WidgetSelector-listItemCheck'>
                  <input type='radio' checked={value === widget.id} />
                </div>
                <div>
                  <div className='WidgetSelector-widgetName'><h4>{widget.name}</h4></div>
                  <div className='WidgetSelector-widgetId'>{widget.id}</div>
                  {
                    widget.description &&
                    <div className='WidgetSelector-widgetDescription'>{widget.description}</div>
                  }
                </div>
              </div>
            )
          })
        }
      </div>
      <footer className='WidgetSelector-footer'>
        <button className='Button--primary' onClick={() => handleClose()}>OK</button>
      </footer>
    </div>
  )
}

import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

export function WidgetSelector ({ value, onClose = () => {}, onChange = () => {} }) {
  const [shared] = React.useContext(SharedContext)

  const [query, setQuery] = React.useState()
  const [widgets, setWidgets] = React.useState([])

  React.useEffect(() => {
    const widgets = Object.values(shared?._widgets || {})
    /**
     * @todo
     * Only use the widgets matching
     * the search query
     */
    setWidgets(widgets)
  }, [query, shared?._widgets])

  function handleClick (id) {
    onChange({ component: id })
  }

  return (
    <div className='WidgetSelector'>
      <header className='WidgetSelector-header'>
        <input type='search' className='WidgetSelector-search' value={query} placeholder='Search for widgets' onChange={e => setQuery(e.target.value)} />
      </header>
      <div className='WidgetSelector-list'>
        {
          (widgets || []).map(widget => {
            return (
              <div className='WidgetSelector-listItem' tabIndex={0} onClick={() => handleClick(widget.id)}>
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
        <button className='Button--primary' onClick={() => onClose()}>OK</button>
      </footer>
    </div>
  )
}

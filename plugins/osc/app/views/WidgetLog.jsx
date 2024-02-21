import React from 'react'

import { SharedContext } from '../sharedContext'

import { LogHeader } from '../components/LogHeader'
import { LogItem } from '../components/LogItem'

const PLUGIN_NAME = 'bridge-plugin-osc'

const INITIAL_SETTINGS = {
  autoScroll: true
}

function scrollToBottom (el) {
  el.scrollTo(0, el.scrollHeight)
}

export const WidgetLog = () => {
  const [state] = React.useContext(SharedContext)
  const [settings, setSettings] = React.useState(INITIAL_SETTINGS)

  const scrollRef = React.useRef()

  const items = React.useMemo(() => {
    return state?.plugins?.[PLUGIN_NAME]?.log || []
  }, [state?.plugins?.[PLUGIN_NAME]?.log])

  React.useEffect(() => {
    if (!settings?.autoScroll) {
      return
    }
    scrollToBottom(scrollRef.current)
  }, [settings?.autoScroll, items.length])

  function handleSettingsChange (newSettings) {
    setSettings(newSettings)
  }

  return (
    <>
      <LogHeader data={settings} onChange={newSettings => handleSettingsChange(newSettings)} />
      <div ref={scrollRef} className='LogList'>
        {
          items.map((item, i) => {
            return <LogItem key={i} item={item} />
          })
        }
      </div>
    </>
  )
}

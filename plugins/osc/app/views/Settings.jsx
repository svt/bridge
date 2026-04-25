import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { TargetInput } from '../components/TargetInput'

const OSC_REFERENCE_URL = 'https://github.com/svt/bridge/blob/main/plugins/osc/README.md'

export const Targets = () => {
  const [state] = React.useContext(SharedContext)
  const targets = state?.plugins?.[window.PLUGIN.name]?.targets || []

  function handleChange (targetId, newData) {
    bridge.commands.executeCommand('osc.editTarget', targetId, newData)
  }

  function handleDelete (targetId) {
    bridge.commands.executeCommand('osc.removeTarget', targetId)
  }

  function handleNew () {
    bridge.commands.executeCommand('osc.addTarget', {})
  }

  return (
    <div>
      {
        (targets || []).map(target => {
          return <TargetInput key={target.id} data={target} onChange={newData => handleChange(target.id, newData)} onDelete={() => handleDelete(target.id)} />
        })
      }
      <button className='Button' onClick={() => handleNew()}>New target</button>
    </div>
  )
}

export const Reference = () => {
  function handleLinkClick (e) {
    e.preventDefault()
    bridge.client.openExternalUrl(OSC_REFERENCE_URL)
  }

  return (
    <div>
      The full OSC reference with valid addresses is available on GitHub<br/>
      <a href='#' onClick={e => handleLinkClick(e)}>View reference on GitHub (external link)</a>
    </div>
  )
}

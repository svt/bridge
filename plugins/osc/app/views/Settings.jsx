import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { TargetInput } from '../components/TargetInput'

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

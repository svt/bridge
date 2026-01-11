import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { LTCInput } from '../components/LTCInput'

export const LTCInputs = () => {
  const [state] = React.useContext(SharedContext)
  const targets = state?.plugins?.[window.PLUGIN.name]?.targets || []

  function handleChange (targetId, newData) {
    bridge.commands.executeCommand('timecode.editLTCInput', targetId, newData)
  }

  function handleDelete (targetId) {
    bridge.commands.executeCommand('timecode.removeLTCInput', targetId)
  }

  function handleNew () {
    bridge.commands.executeCommand('timecode.addLTCInput', {})
  }

  return (
    <div>
      {
        (targets || []).map(target => {
          return <LTCInput key={target.id} data={target} onChange={newData => handleChange(target.id, newData)} onDelete={() => handleDelete(target.id)} />
        })
      }
      <button className='Button' onClick={() => handleNew()}>New target</button>
    </div>
  )
}

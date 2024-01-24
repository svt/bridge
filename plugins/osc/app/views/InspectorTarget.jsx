import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { TargetSelector } from '../components/TargetSelector'

export const InspectorTarget = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])

  React.useEffect(() => {
    async function updateSelection () {
      const selection = await bridge.client.getSelection()
      setSelection(selection)
    }
    updateSelection()
  }, [state])

  function handleChange (newTarget) {
    for (const id of selection) {
      bridge.items.applyItem(id, {
        data: {
          osc: {
            target: newTarget
          }
        }
      })
    }
  }

  const values = React.useMemo(() => {
    const values = new Set()
    for (const id of selection) {
      values.add(state?.items?.[id]?.data?.osc?.target)
    }
    return Array.from(values)
  }, [state, selection])

  return (
    <TargetSelector
      value={values[0]}
      onChange={newTarget => handleChange(newTarget)}
      multipleValuesSelected={values.length > 1}
    />
  )
}

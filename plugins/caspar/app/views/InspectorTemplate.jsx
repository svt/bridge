import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'

import { Monaco } from '../components/Monaco'

export const InspectorTemplate = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])

  const [id, setId] = React.useState()
  const [value, setValue] = React.useState()

  const selectionRef = React.useRef([])

  React.useEffect(() => {
    async function updateSelection () {
      const selection = await bridge.client.getSelection()
      selectionRef.current = selection
      setSelection(selection)
    }
    updateSelection()
  }, [state])

  /*
  Update the value-state only when the selection
  changes to not interfere with writing in the editor
  */
  React.useEffect(() => {
    const items = selection.map(id => state?.items?.[id])
    const value = items?.[0]?.data?.caspar?.templateDataString
    setId(items?.[0]?.id)
    setValue(value)
  }, [JSON.stringify(selection)])

  function handleNewValue (set) {
    for (const id of selectionRef.current) {
      bridge.items.applyItem(id, set)
    }
  }

  function handleChange(newValue) {
    try {
      const parsed = JSON.parse(newValue)
      handleNewValue({
        data: {
          caspar: {
            templateData: { $replace: parsed },
            templateDataString: newValue
          }
        }
      })
    } catch (_) {
      /*
      Invalid JSON data was passed from Monaco
      */
    }
  }

  return (
    <div className='View--spread'>
      <Monaco
        reset={id}
        value={value ?? ['{', '', '}'].join('\n')}
        defaultValue={['{', '', '}'].join('\n')}
        onChange={newValue => handleChange(newValue)}
      />
    </div>
  )
}

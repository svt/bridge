import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'

import { Monaco } from '../components/Monaco'
import { TemplateDataHeader } from '../components/TemplateDataHeader'

const DEFAULT_VALUE = ['{', '', '}'].join('\n')

export const InspectorTemplate = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])

  const [id, setId] = React.useState()
  const [value, setValue] = React.useState()

  const [unsavedValue, setUnsavedValue] = React.useState()

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
    async function loadSelection () {
      const item = await bridge.items.getItem(selection[0])
      setId(item?.id)
      setValue(item?.data?.caspar?.templateDataString)
      setUnsavedValue(undefined)
    }

    loadSelection()
  }, [JSON.stringify(selection)])

  function handleNewValue (set) {
    for (const id of selectionRef.current) {
      bridge.items.applyItem(id, set)
    }
  }

  function handleSave (newValue) {
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

      setValue(newValue)
      setUnsavedValue(undefined)
    } catch (_) {
      /*
      Invalid JSON data was passed from Monaco
      */
    }
  }

  function handleChange (newValue) {
    setUnsavedValue(newValue)
  }

  return (
    <>
      <div className='View--spread u-marginBottom--5px'>
        <TemplateDataHeader hasUnsavedChanges={unsavedValue && unsavedValue !== value} onSave={() => handleSave(unsavedValue)} />
      </div>
      <div className='View--spread'>
        <Monaco
          reset={id}
          value={value ?? DEFAULT_VALUE}
          defaultValue={DEFAULT_VALUE}
          onChange={newValue => handleChange(newValue)}
        />
      </div>
    </>
  )
}

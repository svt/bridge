import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { Select } from '../components/Select'

import { EasingPreview } from '../components/EasingPreview'

import * as easings from '../utils/easings'

export const InspectorTransition = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])

  React.useEffect(() => {
    const selection = bridge.client.getSelection()
    setSelection(selection)
  }, [state])

  function handleNewValue (set) {
    for (const id of selection) {
      bridge.items.applyItem(id, set)
    }
  }

  const items = selection.map(id => state?.items?.[id])
  const transitionEasings = items.map(item => item?.data?.caspar?.transitionEasing)

  return (
    <div className='View--spread'>
      <div>
        <EasingPreview easingName={transitionEasings[0]} />
      </div>
      <div className='u-width--100pct'>
        <Select values={[...transitionEasings]} defaultValue='linear' onChange={newValue => handleNewValue({ data: { caspar: { transitionEasing: newValue } } })}>
          <option value='linear'>Linear</option>
          <option value='easeNone'>EaseNone</option>
          <option value='easeInQuad'>EaseInQuad</option>
          <option value='easeOutQuad'>EaseOutQuad</option>
          <option value='easeInOutQuad'>EaseInOutQuad</option>
          <option value='easeOutInQuad'>EaseOutInQuad</option>
          <option value='easeInCubic'>EaseInCubic</option>
          <option value='easeOutCubic'>EaseOutCubic</option>
          <option value='easeInOutCubic'>EaseInOutCubic</option>
          <option value='easeOutInCubic'>EaseOutInCubic</option>
          <option value='easeInQuart'>EaseInQuart</option>
          <option value='easeOutQuart'>EaseOutQuart</option>
          <option value='easeInOutQuart'>EaseInOutQuart</option>
          <option value='easeOutInQuart'>EaseOutInQuart</option>
          <option value='easeInQuint'>EaseInQuint</option>
          <option value='easeOutQuint'>EaseOutQuint</option>
          <option value='easeInOutQuint'>EaseInOutQuint</option>
          <option value='easeOutInQuint'>EaseOutInQuint</option>
          <option value='easeInSine'>EaseInSine</option>
          <option value='easeOutSine'>EaseOutSine</option>
          <option value='easeInOutSine'>EaseInOutSine</option>
          <option value='easeOutInSine'>EaseOutInSine</option>
          <option value='easeInExpo'>EaseInExpo</option>
          <option value='easeOutExpo'>EaseOutExpo</option>
          <option value='easeInOutExpo'>EaseInOutExpo</option>
          <option value='easeOutInExpo'>EaseOutInExpo</option>
          <option value='easeInCirc'>EaseInCirc</option>
          <option value='easeOutCirc'>EaseOutCirc</option>
          <option value='easeInOutCirc'>EaseInOutCirc</option>
          <option value='easeOutInCirc'>EaseOutInCirc</option>
          <option value='easeInElastic'>EaseInElastic</option>
          <option value='easeOutElastic'>EaseOutElastic</option>
          <option value='easeInOutElastic'>EaseInOutElastic</option>
          <option value='easeOutInElastic'>EaseOutInElastic</option>
          <option value='easeInBack'>EaseInBack</option>
          <option value='easeOutBack'>EaseOutBack</option>
          <option value='easeInOutBack'>EaseInOutBack</option>
          <option value='easeOutInBack'>EaseOutInBack</option>
          <option value='easeOutBounce'>EaseOutBounce</option>
          <option value='easeInBounce'>EaseInBounce</option>
          <option value='easeInOutBounce'>EaseInOutBounce</option>
          <option value='easeOutInBounce'>EaseOutInBounce</option>
        </Select>
      </div>
    </div>
  )
}

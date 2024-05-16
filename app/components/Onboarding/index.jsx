import React from 'react'
import { SharedContext } from '../../sharedContext'

import { Modal } from '../Modal'
import { Icon } from '../Icon'

import content from './onboarding.json'

import './style.css'

export function Onboarding ({ onClose = () => {} }) {
  const [open, setOpen] = React.useState(false)
  const [shared, applyShared] = React.useContext(SharedContext)

  React.useEffect(() => {
    console.log('Getting time', new Date(content.updatedAt).getTime(), shared?._userDefaults?.didCompleteOnboarding)

    if (shared?._userDefaults == null) {
      return
    }

    if (shared?._userDefaults?.didCompleteOnboarding >= new Date(content.updatedAt).getTime()) {
      return
    }
  
    setOpen(true)
  }, [shared?._userDefaults])

  function handleClose () {
    applyShared({
      _userDefaults: {
        didCompleteOnboarding: new Date(content.updatedAt).getTime()
      }
    })
    setOpen(false)
  }
  
  return (
    <Modal open={open} size='small'>
      <div className='Onboarding'>
        <h1>{content.heading}</h1>
        <div className='Onboarding-paragraphs'>
          {
            content.paragraphs.map(paragraph => {
              return (
                <div className='Onboarding-paragraph'>
                  <div className='Onboarding-paragraphIcon'>
                    {
                      paragraph.icon &&
                        <Icon name={paragraph.icon} />
                    }
                  </div>
                  <div>
                    <h3>{paragraph.heading}</h3>
                    {paragraph.body || ''}
                  </div>
                </div>
              )
            })
          }
        </div>
        <div className='Onboarding-footer'>
          <button className='Button Button--primary' onClick={() => handleClose()}>Get started</button>
        </div>
      </div>
    </Modal>
  )
}

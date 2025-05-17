import React, { useState } from "react"

import { Icon } from '../../../../../app/components/Icon'

import "./style.css"

/**
 * Folder name component with click handler
 * 
 * @param {string} name - Name of the folder
 * @param {function} handleClick - Callback to toggle folder open/closed
 * @returns {JSX.Element} Clickable folder name row
 */
const LibraryListFolderName = ({ name, handleClick }) => {
  return (
    <div
      className={`LibraryListFolder-name`}
      onClick={handleClick}
    >
      <div className='LibraryListFolder-nameIcon'>
        <Icon name='arrowRight' />
      </div>
      <div className="LibraryListFolder-nameText">
        {name}
      </div>
    </div>    
  )
}

/**
 * Expandable folder component.
 * 
 * @param {string} name - Name of the folder
 * @param {React.ReactNode} children - Nested content inside the folder
 * @param {Object} node - Folder data object
 * @param {Array} node.files - Array of files within the folder
 * @returns {JSX.Element} Folder section with collapsible content
 */
const LibraryListFolder = ({ name, children, node }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className={`LibraryListFolder ${isOpen ? 'is-open' : 'is-closed'}`}>
      <div className='LibraryListFolder-header'>
        <LibraryListFolderName
          name={name}
          handleClick={() => setIsOpen(!isOpen)}
        />
        <div className="LibraryListFolder-items">{node?.files?.length ?? 0} items</div>
      </div>
      <div className="LibraryListFolder-folder">
        <div className="LibraryListFolder-verticalLine">
          {children}
        </div>
      </div>
    </section>
  )
}

export { LibraryListFolder }

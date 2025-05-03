import React, { useState } from "react"

import { Icon } from '../Icon'
import "./style.css"

/**
 * Render a folder name with an arrow icon
 * 
 * @param {boolean} isOpen - Whether the folder is open or closed
 * @param {string} name - The name of the folder
 * @param {function} handleClick - Open or close the folder
 * @returns {JSX.Element} - Rendered folder name
 */
const FolderName = ({ isOpen, name, handleClick }) => {
  return (
    <div className={`FolderName ${isOpen ? 'is-open' : ''}`} onClick={handleClick}>
      <div className='FolderName-icon'>
        <Icon name='arrow-down' />
      </div>
      <div className="FolderName-text">
        {name}
      </div>
    </div>    
  )
}

/**
 * Render a folder with a list of items
 * 
 * @param {string} name - The name of the folder
 * @param {Array} children - The list of items in the folder
 * @param {object} node - The node object containing the files
 * @returns {JSX.Element} - Rendered folder with items
 */
const LibraryListFolder = ({ name, children, node }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className={'FolderWrapper'}>
      <div className={'FolderHeader'}>
        <FolderName
          name={name}
          isOpen={isOpen}
          handleClick={() => setIsOpen(!isOpen)}
        />
        <div className="FolderItems">{node?.files?.length ?? 0} items</div>
      </div>
      <div className={`CollapsibleFolder ${isOpen ? 'is-open' : 'is-closed'}`}>
        <div className="VerticalLine">
          {children}
        </div>
      </div>
    </section>
  )
}

export { LibraryListFolder }
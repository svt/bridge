import React, {useMemo} from 'react'

import { SharedContext } from '../../sharedContext'

import { LibraryListItem } from '../LibraryListItem'
import { LibraryListFolder } from '../LibraryListFolder'

const { buildFolderTree } = require('../../utils/library.cjs')

import './style.css'

/**
 * Renders a list of items as folder tree, optionally as flat list.
 * 
 * Uses plugin setting to determine whether to display as folder tree or flat list.
 * 
 * @param {Array} items - The list of files with target path.
 * @returns {JSX.Element} Rendered list of library items.
 */
export const LibraryList = ({ items = [] }) => {
  const [shared] = React.useContext(SharedContext)

  const folderSetting = shared?.plugins?.['bridge-plugin-caspar']?.settings?.folder

  // Only re-compute when items change, otherwise folders will close each update
  const folderizedItems = useMemo(() => buildFolderTree(items), [items]) 

  return (
    <div className="LibraryList">
      <div className={`LibraryList ${folderSetting ? 'is-visible' : 'is-hidden'}`}>
        <FolderRecursive data={folderizedItems} />
      </div>
      <ul className={`LibraryList ${folderSetting ? 'is-hidden' : 'is-visible'} ul`}>
        {items.map((item, i) => {
          return <LibraryListItem key={i} item={item} />
        })}
      </ul>
    </div>
  )
}

/**
 * Recursively renders a tree of files and folders.
 * 
 * Iterates through the `data` array, rendering each item as either:
 * - A `LibraryListItem` component if the item is a file (`item.file === true`).
 * - A `LibraryListFolder` component if the item is a folder (`item.file === false`),
 *   and recursively calls `FolderRecursive` on its `files` array.
 * 
 * @param {Array} data - An array of file and folder objects to render.
 * @returns {JSX.Element[]} An array of rendered file and folder components.
 */
const FolderRecursive = ({ data }) => {
  return data.map((item) => {
    if (item.file === true) {
      return <LibraryListItem key={item.id} item={item} className="LibraryListItem" />
    }
    if (item.file === false) {
      return (
        <LibraryListFolder
          key={item.id}
          id={item.id}
          name={item.name}
          node={item}
        >
          <FolderRecursive data={item.files}/>
        </LibraryListFolder>
      )
    }
  })
}

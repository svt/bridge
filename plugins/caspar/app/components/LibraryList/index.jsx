import React, {useMemo} from "react"

import { SharedContext } from "../../sharedContext"

import { LibraryListItem } from "../LibraryListItem"
import { LibraryListFolder } from "../LibraryListFolder"
import { buildFolderTree } from "../../utils/library"

import "./style.css"

export const LibraryList = ({ items, onNodeClick }) => {
  const [shared] = React.useContext(SharedContext)

  const folderSetting = useMemo(() =>
    shared?.plugins?.['bridge-plugin-caspar']?.settings?.folder,
    [shared]
  )

  const folderizedItems = useMemo(() => buildFolderTree(items), [items])

  return (
    <div>
      <div className={`LibraryList ${folderSetting}`}>
        <FolderRecursive data={folderizedItems} parentNode={folderizedItems} />
      </div>
      <ul className={`LibraryList ${!folderSetting}`}>
      {
        (items || []).map((item, i) => {
          const itemWithTarget = { ...item, target: item.name }
          return <LibraryListItem key={i} item={itemWithTarget} />
        })
      }
      </ul>
    </div>
  )
}

const FolderRecursive = ({ data, parentNode }) => {
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
          <FolderRecursive data={item.files} parentNode={item} />
        </LibraryListFolder>
      )
    }
  })
}

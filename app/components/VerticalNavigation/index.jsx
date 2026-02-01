import React from 'react'

import './style.css'

/**
 * A vertical navigation
 * suitable for sidebars
 *
 * Will call the onClick function
 * with an array of an index path
 * for the selected item
 *
 * @example
 * [
 *  {
 *   title: 'Section 1',
 *   items: [
 *     { title: 'Item 1' },
 *     { title: 'Item 2' },
 *     { title: 'Item 3' }
 *   ]
 *  },
 *  {
 *   title: 'Section 2',
 *   items: [
 *     { title: 'Item 1' },
 *     { title: 'Item 2' },
 *     { title: 'Item 3' }
 *   ]
 *  }
 * ]
 *
 * @param {{
 *  sections: Object[],
 *  active: Number[],
 *  onClick: (Number[]) => {}
 * }} props
 * @returns
 */
export function VerticalNavigation ({ sections = [], active = [0, 0], onClick = () => {} }) {
  const [activePath, setActivePath] = React.useState(active)

  function handleClick (e, section, item) {
    e.preventDefault()
    setActivePath([section, item])
    onClick([section, item])
  }

  return (
    <nav className='VerticalNavigation'>
      {
        sections.map((section, i) => {
          return (
            <ul key={`${section?.title}-${i}-${section?.items?.length}`} className='VerticalNavigation-section'>
              {
                /*
                Render the section's
                label if it has one
                */
                section.title
                  ? <div className='VerticalNavigation-sectionLabel u-text--label'>{section.title}</div>
                  : <></>
              }
              {
                /*
                Render each item as its
                own link

                We use anchor-link elements
                here in order to provide better
                accessibility
                */
                (section?.items || []).map((item, j) => {
                  const isActive = activePath?.[0] === i && activePath?.[1] === j
                  return (
                    <a
                      key={`${section?.title}-${item?.title}-${j}`}
                      href='#'
                      className={`VerticalNavigation-item ${isActive ? 'is-active' : ''}`}
                      onClick={e => handleClick(e, i, j)}
                    >
                      {item?.title}
                    </a>
                  )
                })
              }
            </ul>
          )
        })
      }
    </nav>
  )
}

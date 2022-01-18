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
 *   label: 'Section 1',
 *   items: [
 *     'Item 1',
 *     'Item 2',
 *     'Item 3'
 *   ]
 *  },
 *  {
 *   label: 'Section 2',
 *   items: [
 *     'Item 1',
 *     'Item 2',
 *     'Item 3'
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
            <ul key={i} className='VerticalNavigation-section'>
              {
                /*
                Render the section's
                label if it has one
                */
                section.label
                  ? <div className='VerticalNavigation-sectionLabel u-text--label'>{section.label}</div>
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
                      key={j}
                      href='#'
                      className={`VerticalNavigation-item ${isActive ? 'is-active' : ''}`}
                      onClick={e => handleClick(e, i, j)}
                    >
                      {item}
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

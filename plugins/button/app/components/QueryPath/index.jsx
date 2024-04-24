import React from 'react'

function getQueryParam (path, param) {
  const params = new URLSearchParams(path)
  return params.get(param)
}

export const QueryPath = ({ path, children }) => {
  const [currentPath, setCurrentPath] = React.useState()

  React.useEffect(() => {
    function onPopState () {
      setCurrentPath(getQueryParam(window.location.search, 'path'))
    }

    onPopState()
    
    window.addEventListener('popstate', onPopState)
    return window.removeEventListener('popstate', onPopState)
  }, [])

  if (currentPath !== path) {
    return <></>
  }

  return (
    <>
      {children}
    </>
  )
}

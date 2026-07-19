/**
 * @author Axel Boberg
 */

import React from 'react'
import { ErrorMessage } from '../components/ErrorMessage'

export const Error = () => {
  const heading = new URLSearchParams(window.location.search).get('heading') || 'Error'
  const message = new URLSearchParams(window.location.search).get('message') || 'An unexpected error occurred'

  return (
    <ErrorMessage heading={heading} message={message} />
  )
}

import React from 'react'
import './style.css'

export const ThumbnailImage = ({ src, alt = 'Thumbnail image' }) => {
  return (
    <div className='ThumbnailImage'>
      {
        src
          ? <img className='ThumbnailImage-img' alt={alt} src={src} />
          : <div className='ThumbnailImage-text'>Thumbnail is not available</div>
      }
    </div>
  )
}

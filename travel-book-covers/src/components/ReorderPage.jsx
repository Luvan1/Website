import React, { useState, useRef } from 'react'

export default function ReorderPage({ design, initialPhotos, onBack, onDone }) {
  const [photos, setPhotos] = useState([...initialPhotos])
  const dragIdx = useRef(null)
  const dragOverIdx = useRef(null)

  function onDragStart(i) {
    dragIdx.current = i
  }

  function onDragEnter(i) {
    dragOverIdx.current = i
    if (i === dragIdx.current) return
    setPhotos(prev => {
      const next = [...prev]
      const [item] = next.splice(dragIdx.current, 1)
      next.splice(i, 0, item)
      dragIdx.current = i
      return next
    })
  }

  function onDragEnd() {
    dragIdx.current = null
    dragOverIdx.current = null
  }

  return (
    <div className="page">
      <div className="page-nav">
        <button className="btn-back" onClick={() => onBack(photos)}>← Add photos</button>
        <div className="design-summary">
          <span>{design.country.flag} {design.country.name} · {design.year}</span>
        </div>
      </div>

      <h2 className="section-title">Reorder your photos</h2>
      <p className="section-sub">Drag thumbnails to set the order they appear in your book.</p>

      <div className="reorder-grid">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className={`reorder-thumb ${dragIdx.current === i ? 'dragging' : ''}`}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragEnd={onDragEnd}
            onDragOver={e => e.preventDefault()}
          >
            <div className="reorder-num">{i + 1}</div>
            <img src={photo.url} alt={photo.name} draggable={false} />
            <div className="reorder-handle">⠿</div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={() => onDone(photos)}
        style={{ marginTop: '2rem' }}
      >
        Preview book →
      </button>
    </div>
  )
}

import React, { useState, useRef, useCallback } from 'react'

export default function PhotoPage({ design, initialPhotos, onBack, onDone }) {
  const [photos, setPhotos] = useState(initialPhotos || [])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const addFiles = useCallback((files) => {
    const newPhotos = []
    let loaded = 0
    const total = files.length
    if (total === 0) return

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) { loaded++; return }
      const url = URL.createObjectURL(file)
      newPhotos.push({ id: `${Date.now()}-${Math.random()}`, url, name: file.name })
      loaded++
      if (loaded === total) {
        setPhotos(prev => [...prev, ...newPhotos])
      }
    })
  }, [])

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function handleRemove(id) {
    setPhotos(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="page">
      <div className="page-nav">
        <button className="btn-back" onClick={onBack}>← Cover design</button>
        <div className="design-summary">
          <span>{design.country.flag}</span>
          <span>{design.country.name}</span>
          <span>·</span>
          <span>{design.monument.name}</span>
          <span>·</span>
          <span>{design.template.name}</span>
          <span>·</span>
          <span>{design.year}</span>
        </div>
      </div>

      <h2 className="section-title">Add your photos</h2>
      <p className="section-sub">Photos are stored in your browser — nothing is uploaded.</p>

      {/* Drop zone */}
      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <div className="dropzone-icon">📷</div>
        <div className="dropzone-text">
          <strong>Drag & drop photos here</strong>
          <span>or click to browse</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <>
          <div className="photo-count">{photos.length} photo{photos.length !== 1 ? 's' : ''} added</div>
          <div className="photo-grid">
            {photos.map(photo => (
              <div key={photo.id} className="photo-thumb">
                <img src={photo.url} alt={photo.name} />
                <button
                  className="photo-remove"
                  onClick={() => handleRemove(photo.id)}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={() => onDone(photos)}
            style={{ marginTop: '2rem' }}
          >
            Done adding photos — Reorder →
          </button>
        </>
      )}

      {photos.length === 0 && (
        <p className="empty-hint">Add at least one photo to continue.</p>
      )}
    </div>
  )
}

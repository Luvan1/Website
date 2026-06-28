import React from 'react'
import CoverSVG from './CoverSVG'

export default function BookPreview({ design, photos, onEditDesign, onEditPhotos }) {
  function handlePrint() {
    window.print()
  }

  return (
    <div className="page preview-page">
      <div className="page-nav">
        <button className="btn-back" onClick={onEditPhotos}>← Reorder photos</button>
        <h2 className="section-title" style={{ margin: 0 }}>Your book preview</h2>
        <button className="btn-secondary" onClick={handlePrint}>🖨 Print / Save PDF</button>
      </div>

      <div className="book-strip" id="book-strip">
        {/* Front cover */}
        <div className="book-page book-cover">
          <div className="book-page-inner">
            <CoverSVG
              country={design.country}
              monumentId={design.monument.id}
              colorTemplate={design.template}
              year={design.year}
              side="front"
            />
          </div>
          <span className="page-label">Front cover</span>
        </div>

        {/* Photo pages */}
        {photos.map((photo, i) => (
          <div key={photo.id} className="book-page book-photo-page">
            <div className="book-page-inner">
              <img src={photo.url} alt={photo.name} className="book-photo" />
            </div>
            <span className="page-label">Photo {i + 1}</span>
          </div>
        ))}

        {/* Back cover */}
        <div className="book-page book-cover">
          <div className="book-page-inner">
            <CoverSVG
              country={design.country}
              monumentId={design.monument.id}
              colorTemplate={design.template}
              year={design.year}
              side="back"
            />
          </div>
          <span className="page-label">Back cover</span>
        </div>
      </div>

      <div className="preview-actions">
        <button className="btn-secondary" onClick={onEditDesign}>
          ← Change cover design
        </button>
        <button className="btn-secondary" onClick={onEditPhotos}>
          ← Change photos / order
        </button>
        <button className="btn-primary" onClick={handlePrint}>
          🖨 Print / Save as PDF
        </button>
      </div>

      <p className="print-hint">
        Tip: Use your browser's <strong>Print</strong> dialog (Ctrl/Cmd+P) and choose
        <strong> Save as PDF</strong> to export your book.
      </p>
    </div>
  )
}

import React, { useState } from 'react'
import CoverSVG from './CoverSVG'

const YEAR_MIN = 1950
const YEAR_MAX = 2035

export default function DesignStudio({ country, onBack, onConfirm }) {
  const [templateId, setTemplateId] = useState(country.colorTemplates[0].id)
  const [monumentId, setMonumentId] = useState(country.monuments[0].id)
  const [year, setYear] = useState(new Date().getFullYear())

  const template = country.colorTemplates.find(t => t.id === templateId)
  const monument = country.monuments.find(m => m.id === monumentId)

  function handleConfirm() {
    onConfirm({ country, monument, template, year })
  }

  return (
    <div className="studio-layout">
      {/* ── Live Preview Pane ── */}
      <div className="preview-pane">
        <div className="preview-cover">
          <CoverSVG
            country={country}
            monumentId={monumentId}
            colorTemplate={template}
            year={year}
            side="front"
          />
        </div>
        <p className="preview-label">Live preview · Front cover</p>
      </div>

      {/* ── Controls Pane ── */}
      <div className="controls-pane">
        <div className="controls-header">
          <button className="btn-back" onClick={onBack}>← Countries</button>
          <div>
            <h2 className="country-title">{country.flag} {country.name}</h2>
            <p className="controls-sub">Customize your cover</p>
          </div>
        </div>

        {/* Color Template */}
        <section className="control-section">
          <h3 className="control-label">Color theme</h3>
          <div className="template-swatches">
            {country.colorTemplates.map(t => (
              <button
                key={t.id}
                className={`swatch-card ${templateId === t.id ? 'active' : ''}`}
                onClick={() => setTemplateId(t.id)}
              >
                <div
                  className="swatch-preview"
                  style={{ background: t.background }}
                >
                  <div className="swatch-ink" style={{ background: t.ink }} />
                  <div className="swatch-year" style={{ background: t.year }} />
                </div>
                <span className="swatch-name">{t.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Monument */}
        <section className="control-section">
          <h3 className="control-label">Monument</h3>
          <div className="monument-grid">
            {country.monuments.map(m => (
              <button
                key={m.id}
                className={`monument-card ${monumentId === m.id ? 'active' : ''}`}
                onClick={() => setMonumentId(m.id)}
              >
                <div className="monument-thumb">
                  <CoverSVG
                    country={country}
                    monumentId={m.id}
                    colorTemplate={template}
                    year={year}
                    side="front"
                  />
                </div>
                <span className="monument-name">{m.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Year */}
        <section className="control-section">
          <h3 className="control-label">Year</h3>
          <div className="year-input-wrap">
            <input
              type="number"
              className="year-input"
              value={year}
              min={YEAR_MIN}
              max={YEAR_MAX}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) setYear(v)
              }}
            />
            <span className="year-hint">{YEAR_MIN}–{YEAR_MAX}</span>
          </div>
        </section>

        <button className="btn-primary btn-confirm" onClick={handleConfirm}>
          Add photos →
        </button>
      </div>
    </div>
  )
}

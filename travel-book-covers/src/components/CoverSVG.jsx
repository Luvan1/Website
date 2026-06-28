import React from 'react'

// Cloud positions — same on every cover
const CLOUDS = [
  { cx: 390, cy: 1060, rx: 75, ry: 36 },
  { cx: 455, cy: 1035, rx: 60, ry: 28 },
  { cx: 510, cy: 1050, rx: 50, ry: 24 },
  { cx: 540, cy: 1090, rx: 55, ry: 22 },
  { cx: 420, cy: 1095, rx: 45, ry: 20 },
  { cx: 1060, cy: 1065, rx: 70, ry: 34 },
  { cx: 1130, cy: 1038, rx: 58, ry: 26 },
  { cx: 1185, cy: 1055, rx: 52, ry: 22 },
  { cx: 1215, cy: 1095, rx: 50, ry: 20 },
  { cx: 1080, cy: 1100, rx: 48, ry: 18 },
]

/**
 * Renders a single SVG element descriptor produced by monument element functions.
 * Supports: rect, circle, ellipse, path, polygon, line, g (with children array).
 */
function SvgEl({ el: e }) {
  if (!e) return null

  // Handle g with children array
  if (e.type === 'g') {
    const { children, ...rest } = e.attrs || {}
    return (
      <g {...rest}>
        {Array.isArray(children) && children.map((child, i) => (
          <SvgEl key={i} el={child} />
        ))}
      </g>
    )
  }

  const Tag = e.type
  return <Tag {...e.attrs} />
}

/**
 * Main parameterized cover SVG component.
 *
 * Props:
 *   country       — country data object (from COUNTRIES)
 *   monumentId    — string id of the selected monument
 *   colorTemplate — color template object {background, ink, year}
 *   year          — number or string
 *   side          — 'front' | 'back'
 */
export default function CoverSVG({ country, monumentId, colorTemplate, year, side }) {
  const { background, ink, year: yearColor } = colorTemplate
  const ACCENT = '#FBF1E7' // cream accent for snow caps, windows, etc.

  if (side === 'back') {
    return (
      <svg
        viewBox="0 0 1600 2400"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <rect width="1600" height="2400" fill={background} />
      </svg>
    )
  }

  // Resolve monument
  const monument = country.monuments.find(m => m.id === monumentId) || country.monuments[0]
  const monumentElements = monument.elements(ink, ACCENT)

  // The monument group transform: scale 1.15 anchored at (800, 1840)
  const monumentTransform = 'translate(800,1840) scale(1.15,1.15) translate(-800,-1840)'

  // Reflection group transform: mirror vertically about y=1840, scale 1.15 same anchor
  const reflectionTransform =
    'translate(0,3680) scale(1,-1) translate(800,1840) scale(1.15,1.15) translate(-800,-1840)'

  return (
    <svg
      viewBox="0 0 1600 2400"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        {/* Gradient to fade the lake reflection */}
        <linearGradient id="lakeFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={background} stopOpacity="0" />
          <stop offset="100%" stopColor={background} stopOpacity="0.90" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1600" height="2400" fill={background} />

      {/* ── Lake reflection ── */}
      <g transform={reflectionTransform} opacity="0.32">
        {monumentElements.map((e, i) => <SvgEl key={i} el={e} />)}
      </g>

      {/* Fade overlay on the lake */}
      <rect x="0" y="1840" width="1600" height="560" fill="url(#lakeFade)" />

      {/* Horizon accent line */}
      <rect x="0" y="1838" width="1600" height="4" fill={ink} opacity="0.5" />

      {/* Decorative clouds */}
      {CLOUDS.map((c, i) => (
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={ACCENT} />
      ))}

      {/* Monument (scaled 1.15×, base on horizon) */}
      <g transform={monumentTransform}>
        {monumentElements.map((e, i) => <SvgEl key={i} el={e} />)}
      </g>

      {/* Country title */}
      <text
        x="800"
        y="520"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="680"
        fill={ink}
        textLength="1520"
        lengthAdjust="spacingAndGlyphs"
      >
        {country.name.toUpperCase()}
      </text>

      {/* Year */}
      <text
        x="1540"
        y="650"
        textAnchor="end"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        fontSize="130"
        fill={yearColor}
      >
        {year}
      </text>
    </svg>
  )
}

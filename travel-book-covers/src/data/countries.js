// ─────────────────────────────────────────────────────────────────────────────
// Color Templates
// ─────────────────────────────────────────────────────────────────────────────

export const CLASSIC_TEMPLATE = {
  id: 'classic',
  name: 'Classic',
  background: '#F5D9C8',
  ink: '#1F3B54',
  year: '#4A6B85',
}

// ─────────────────────────────────────────────────────────────────────────────
// Monument shape helpers
// Each monument is a function (ink, accent) => array of SVG element descriptors
// All shapes are anchored so their base sits at y=1840 on a 1600×2400 canvas.
// ─────────────────────────────────────────────────────────────────────────────

function el(type, attrs) {
  return { type, attrs }
}

// ─── FRANCE ──────────────────────────────────────────────────────────────────
const eiffelTower = (ink, accent) => [
  // Main tower silhouette
  el('path', {
    d: `M800,1140 L793,1200 L775,1370 L800,1385 L825,1370 L807,1200 L800,1140 Z`,
    fill: ink,
  }),
  // First platform
  el('rect', { x: 690, y: 1370, width: 220, height: 28, fill: ink }),
  // Left leg
  el('path', {
    d: `M690,1398 L665,1840 L720,1840 L760,1560 L740,1555 L780,1398 Z`,
    fill: ink,
  }),
  // Right leg
  el('path', {
    d: `M910,1398 L935,1840 L880,1840 L840,1560 L860,1555 L820,1398 Z`,
    fill: ink,
  }),
  // Cross brace lower
  el('path', {
    d: `M680,1620 L720,1840 L680,1840 Z`,
    fill: ink,
    opacity: '0.3',
  }),
  // Second platform
  el('rect', { x: 750, y: 1200, width: 100, height: 20, fill: ink }),
  // Antenna
  el('rect', { x: 797, y: 1095, width: 6, height: 50, fill: accent }),
  // Flag beacon
  el('circle', { cx: 800, cy: 1093, r: 8, fill: accent }),
]

const arcDeTriomphe = (ink, accent) => [
  // Base
  el('rect', { x: 580, y: 1790, width: 440, height: 50, fill: ink }),
  // Left pillar
  el('rect', { x: 580, y: 1350, width: 140, height: 440, fill: ink }),
  // Right pillar
  el('rect', { x: 880, y: 1350, width: 140, height: 440, fill: ink }),
  // Arch
  el('path', {
    d: `M580,1440 Q580,1230 800,1230 Q1020,1230 1020,1440 L1020,1350 Q1020,1110 800,1110 Q580,1110 580,1350 Z`,
    fill: ink,
  }),
  // Inner arch cutout
  el('path', {
    d: `M720,1790 L720,1490 Q720,1340 800,1340 Q880,1340 880,1490 L880,1790 Z`,
    fill: '#00000000',
    style: 'mix-blend-mode:destination-out',
  }),
  // Attic relief band
  el('rect', { x: 580, y: 1310, width: 440, height: 40, fill: accent, opacity: '0.5' }),
]

const versaillesPalace = (ink, accent) => [
  // Main facade
  el('rect', { x: 280, y: 1600, width: 1040, height: 240, fill: ink }),
  // Central wings raised
  el('rect', { x: 400, y: 1510, width: 800, height: 90, fill: ink }),
  // Center pavilion
  el('rect', { x: 620, y: 1400, width: 360, height: 110, fill: ink }),
  // Mansard roof center
  el('path', { d: `M620,1400 L800,1280 L980,1400 Z`, fill: ink }),
  // Left wing mansard
  el('path', { d: `M400,1510 L500,1460 L600,1510 Z`, fill: ink }),
  // Right wing mansard
  el('path', { d: `M1000,1510 L1100,1460 L1200,1510 Z`, fill: ink }),
  // Windows row main
  ...Array.from({ length: 7 }, (_, i) => el('rect', { x: 440 + i * 130, y: 1630, width: 70, height: 100, fill: accent, opacity: '0.35' })),
  // Windows row center
  ...Array.from({ length: 3 }, (_, i) => el('rect', { x: 670 + i * 120, y: 1430, width: 60, height: 70, fill: accent, opacity: '0.35' })),
  // Chimneys
  el('rect', { x: 770, y: 1240, width: 20, height: 45, fill: accent }),
  el('rect', { x: 810, y: 1240, width: 20, height: 45, fill: accent }),
  // Columns hint
  ...Array.from({ length: 9 }, (_, i) => el('rect', { x: 440 + i * 110, y: 1510, width: 10, height: 90, fill: accent, opacity: '0.25' })),
]

// ─── SPAIN ────────────────────────────────────────────────────────────────────
const sagradaFamilia = (ink, accent) => [
  // Left spire cluster
  el('path', { d: `M540,1840 L540,1400 L510,1380 L550,1180 L570,1380 L560,1390 L570,1840 Z`, fill: ink }),
  el('path', { d: `M620,1840 L620,1420 L600,1400 L630,1240 L650,1400 L640,1410 L660,1840 Z`, fill: ink }),
  // Center main spires
  el('path', { d: `M700,1840 L700,1320 L680,1300 L720,1060 L740,1300 L730,1310 L760,1840 Z`, fill: ink }),
  el('path', { d: `M840,1840 L840,1320 L820,1300 L860,1060 L880,1300 L870,1310 L900,1840 Z`, fill: ink }),
  // Right spire cluster
  el('path', { d: `M940,1840 L940,1420 L920,1400 L950,1240 L970,1400 L960,1410 L980,1840 Z`, fill: ink }),
  el('path', { d: `M1020,1840 L1020,1400 L1000,1380 L1030,1180 L1050,1380 L1060,1390 L1070,1840 Z`, fill: ink }),
  // Facade base
  el('rect', { x: 480, y: 1680, width: 640, height: 160, fill: ink }),
  // Rose window hint
  el('circle', { cx: 800, cy: 1720, r: 50, fill: accent, opacity: '0.4' }),
  // Spire finials
  el('circle', { cx: 530, cy: 1178, r: 12, fill: accent }),
  el('circle', { cx: 640, cy: 1238, r: 12, fill: accent }),
  el('circle', { cx: 720, cy: 1058, r: 14, fill: accent }),
  el('circle', { cx: 860, cy: 1058, r: 14, fill: accent }),
  el('circle', { cx: 950, cy: 1238, r: 12, fill: accent }),
  el('circle', { cx: 1040, cy: 1178, r: 12, fill: accent }),
]

const alhambra = (ink, accent) => [
  // Hill base
  el('path', { d: `M300,1840 Q500,1700 800,1680 Q1100,1700 1300,1840 Z`, fill: ink, opacity: '0.4' }),
  // Main palace body
  el('rect', { x: 480, y: 1480, width: 640, height: 360, fill: ink }),
  // Moorish arch row
  ...Array.from({ length: 5 }, (_, i) =>
    el('path', { d: `M${520 + i * 120},1840 L${520 + i * 120},1620 Q${580 + i * 120},1540 ${640 + i * 120},1620 L${640 + i * 120},1840 Z`, fill: accent, opacity: '0.3' })
  ),
  // Towers
  el('rect', { x: 380, y: 1340, width: 120, height: 500, fill: ink }),
  el('rect', { x: 1100, y: 1340, width: 120, height: 500, fill: ink }),
  // Tower battlements
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 384 + i * 22, y: 1320, width: 14, height: 30, fill: ink })),
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 1104 + i * 22, y: 1320, width: 14, height: 30, fill: ink })),
  // Center ornate gate
  el('path', { d: `M720,1840 L720,1570 Q720,1490 800,1490 Q880,1490 880,1570 L880,1840 Z`, fill: ink }),
  el('path', { d: `M745,1840 L745,1575 Q745,1520 800,1520 Q855,1520 855,1575 L855,1840 Z`, fill: accent, opacity: '0.3' }),
  // Parapets top
  el('rect', { x: 480, y: 1460, width: 640, height: 20, fill: ink }),
  ...Array.from({ length: 10 }, (_, i) => el('rect', { x: 490 + i * 62, y: 1440, width: 32, height: 22, fill: ink })),
]

const plazaEspana = (ink, accent) => [
  // Semicircular building base
  el('path', { d: `M300,1840 L300,1700 Q300,1480 800,1480 Q1300,1480 1300,1700 L1300,1840 Z`, fill: ink }),
  // Cutout center courtyard
  el('path', { d: `M450,1840 L450,1720 Q450,1560 800,1560 Q1150,1560 1150,1720 L1150,1840 Z`, fill: '#FFFFFF', opacity: '0' }),
  // Left tower
  el('rect', { x: 280, y: 1240, width: 120, height: 600, fill: ink }),
  el('path', { d: `M280,1240 L340,1140 L400,1240 Z`, fill: ink }),
  // Right tower
  el('rect', { x: 1200, y: 1240, width: 120, height: 600, fill: ink }),
  el('path', { d: `M1200,1240 L1260,1140 L1320,1240 Z`, fill: ink }),
  // Bridge arches
  el('path', { d: `M400,1840 L400,1720 Q400,1650 470,1650 Q540,1650 540,1720 L540,1840 Z`, fill: ink }),
  el('path', { d: `M1060,1840 L1060,1720 Q1060,1650 1130,1650 Q1200,1650 1200,1720 L1200,1840 Z`, fill: ink }),
  // Windows
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 310 + i * 10, y: 1280 + i * 40, width: 60, height: 40, fill: accent, opacity: '0.35' })),
  // Fountain
  el('circle', { cx: 800, cy: 1780, r: 60, fill: accent, opacity: '0.3' }),
  el('circle', { cx: 800, cy: 1780, r: 30, fill: accent, opacity: '0.4' }),
]

// ─── UNITED STATES ────────────────────────────────────────────────────────────
const statuOfLiberty = (ink, accent) => [
  // Pedestal base
  el('rect', { x: 660, y: 1700, width: 280, height: 140, fill: ink }),
  el('rect', { x: 690, y: 1620, width: 220, height: 80, fill: ink }),
  // Body/robe
  el('path', { d: `M730,1620 L700,1200 L730,1190 L750,1180 L800,1170 L850,1180 L870,1190 L900,1200 L870,1620 Z`, fill: ink }),
  // Left arm
  el('path', { d: `M700,1400 L640,1280 L680,1260 L740,1380 Z`, fill: ink }),
  // Right arm — raised with torch
  el('path', { d: `M870,1380 L940,1240 L920,1220 L900,1200 L850,1340 Z`, fill: ink }),
  // Torch
  el('rect', { x: 932, y: 1160, width: 16, height: 70, fill: accent }),
  el('path', { d: `M932,1160 Q940,1110 948,1160 Z`, fill: accent }),
  el('ellipse', { cx: 940, cy: 1150, rx: 18, ry: 28, fill: accent }),
  // Head
  el('ellipse', { cx: 800, cy: 1150, rx: 55, ry: 65, fill: ink }),
  // Crown spikes
  el('path', { d: `M800,1090 L790,1030 L810,1030 Z`, fill: ink }),
  el('path', { d: `M750,1105 L730,1050 L755,1055 Z`, fill: ink }),
  el('path', { d: `M850,1105 L870,1050 L845,1055 Z`, fill: ink }),
  el('path', { d: `M770,1092 L745,1038 L768,1045 Z`, fill: ink }),
  el('path', { d: `M830,1092 L855,1038 L832,1045 Z`, fill: ink }),
  // Book
  el('rect', { x: 700, y: 1290, width: 80, height: 50, fill: accent, opacity: '0.6' }),
]

const grandCanyon = (ink, accent) => [
  // Sky silhouette plateau
  el('rect', { x: 0, y: 1840, width: 1600, height: 0, fill: ink }),
  // Canyon layers - stacked horizontal bands
  el('path', { d: `M0,1840 L0,1600 L200,1600 L250,1650 L350,1580 L500,1620 L600,1560 L700,1580 L800,1520 L900,1580 L1000,1560 L1100,1620 L1250,1580 L1350,1650 L1400,1600 L1600,1600 L1600,1840 Z`, fill: ink }),
  el('path', { d: `M0,1840 L0,1660 L150,1660 L200,1700 L300,1660 L400,1680 L500,1650 L600,1670 L700,1640 L800,1660 L900,1640 L1000,1670 L1100,1650 L1200,1680 L1300,1660 L1400,1700 L1450,1660 L1600,1660 L1600,1840 Z`, fill: ink, opacity: '0.6' }),
  el('path', { d: `M0,1840 L0,1720 L100,1720 L150,1750 L250,1720 L350,1740 L450,1720 L550,1735 L650,1720 L750,1730 L850,1720 L950,1730 L1050,1720 L1150,1740 L1250,1720 L1350,1750 L1450,1720 L1600,1720 L1600,1840 Z`, fill: ink, opacity: '0.8' }),
  // Canyon walls
  el('path', { d: `M0,1600 L0,1840 L280,1840 L280,1700 L340,1650 L340,1580 Z`, fill: ink }),
  el('path', { d: `M1600,1600 L1600,1840 L1320,1840 L1320,1700 L1260,1650 L1260,1580 Z`, fill: ink }),
  // Mesas/buttes
  el('path', { d: `M580,1840 L580,1560 L680,1490 L780,1540 L780,1840 Z`, fill: ink }),
  el('path', { d: `M820,1840 L820,1540 L920,1490 L1020,1560 L1020,1840 Z`, fill: ink }),
  el('path', { d: `M680,1490 L780,1440 L880,1490 L820,1540 L780,1540 Z`, fill: ink }),
  // Accent layer
  el('path', { d: `M680,1490 L780,1440 L880,1490`, fill: accent, opacity: '0.5' }),
]

const empireSateBuilding = (ink, accent) => [
  // Wide base
  el('rect', { x: 520, y: 1750, width: 560, height: 90, fill: ink }),
  // Setback 1
  el('rect', { x: 580, y: 1640, width: 440, height: 110, fill: ink }),
  // Setback 2
  el('rect', { x: 640, y: 1530, width: 320, height: 110, fill: ink }),
  // Setback 3
  el('rect', { x: 690, y: 1430, width: 220, height: 100, fill: ink }),
  // Setback 4
  el('rect', { x: 720, y: 1340, width: 160, height: 90, fill: ink }),
  // Setback 5
  el('rect', { x: 745, y: 1270, width: 110, height: 70, fill: ink }),
  // Art deco crown
  el('rect', { x: 760, y: 1200, width: 80, height: 70, fill: ink }),
  el('rect', { x: 772, y: 1150, width: 56, height: 55, fill: ink }),
  // Mooring mast / antenna
  el('rect', { x: 797, y: 1060, width: 6, height: 90, fill: accent }),
  el('rect', { x: 794, y: 1100, width: 12, height: 50, fill: ink }),
  // Observatory windows band
  el('rect', { x: 762, y: 1202, width: 76, height: 10, fill: accent, opacity: '0.5' }),
  // Window columns
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 597 + i * 80, y: 1650, width: 20, height: 80, fill: accent, opacity: '0.2' })),
]

// ─── ITALY ────────────────────────────────────────────────────────────────────
const colosseum = (ink, accent) => [
  // Outer ellipse base
  el('ellipse', { cx: 800, cy: 1840, rx: 520, ry: 120, fill: ink }),
  // Main outer wall
  el('path', {
    d: `M280,1840 L280,1540 Q280,1340 800,1340 Q1320,1340 1320,1540 L1320,1840 Z`,
    fill: ink,
  }),
  // Inner wall (lighter)
  el('path', {
    d: `M380,1840 L380,1560 Q380,1420 800,1420 Q1220,1420 1220,1560 L1220,1840 Z`,
    fill: accent,
    opacity: '0.25',
  }),
  // Arch rows - outer
  ...Array.from({ length: 9 }, (_, i) => {
    const angle = (-Math.PI * 0.65) + i * (Math.PI * 1.3 / 8)
    const cx = 800 + 500 * Math.cos(angle)
    const cy = 1840 - 110 * Math.sin(angle) * 2
    return el('ellipse', { cx: Math.round(cx), cy: Math.round(cy) - 100, rx: 28, ry: 55, fill: accent, opacity: '0.3' })
  }),
  // Second tier arches
  ...Array.from({ length: 9 }, (_, i) => {
    const angle = (-Math.PI * 0.65) + i * (Math.PI * 1.3 / 8)
    const cx = 800 + 500 * Math.cos(angle)
    const cy = 1840 - 110 * Math.sin(angle) * 2
    return el('ellipse', { cx: Math.round(cx), cy: Math.round(cy) - 230, rx: 28, ry: 55, fill: accent, opacity: '0.3' })
  }),
  // Ruin broken top right
  el('path', {
    d: `M1100,1340 L1150,1300 L1200,1340 L1320,1340 L1320,1380 L1200,1380 L1160,1360 L1120,1380 L1100,1380 Z`,
    fill: ink,
  }),
  // Floor
  el('ellipse', { cx: 800, cy: 1780, rx: 300, ry: 60, fill: accent, opacity: '0.2' }),
]

const leaningTowerPisa = (ink, accent) => [
  // Tilt angle ~8deg, lean right
  el('g', {
    transform: 'rotate(5,800,1840)',
    children: [
      // Base colonnade
      el('rect', { x: 660, y: 1790, width: 280, height: 50, fill: ink }),
      // Shaft tiers
      ...Array.from({ length: 7 }, (_, i) => [
        el('rect', { x: 670, y: 1790 - (i + 1) * 87, width: 260, height: 60, fill: ink }),
        el('rect', { x: 680, y: 1797 - (i + 1) * 87, width: 240, height: 46, fill: accent, opacity: '0.2' }),
      ]).flat(),
      // Top belfry
      el('rect', { x: 700, y: 1180, width: 200, height: 80, fill: ink }),
      // Bell chamber arches
      ...Array.from({ length: 4 }, (_, i) => el('ellipse', { cx: 720 + i * 50, cy: 1220, rx: 16, ry: 30, fill: accent, opacity: '0.4' })),
      // Roof
      el('ellipse', { cx: 800, cy: 1178, rx: 90, ry: 22, fill: ink }),
      el('ellipse', { cx: 800, cy: 1162, rx: 35, ry: 10, fill: ink }),
    ],
  }),
]

const treviFountain = (ink, accent) => [
  // Palace backdrop
  el('rect', { x: 380, y: 1360, width: 840, height: 480, fill: ink }),
  // Column pillasters
  ...Array.from({ length: 6 }, (_, i) => el('rect', { x: 400 + i * 140, y: 1360, width: 30, height: 480, fill: accent, opacity: '0.2' })),
  // Attic story
  el('rect', { x: 380, y: 1280, width: 840, height: 80, fill: ink }),
  // Pediment center
  el('path', { d: `M620,1280 L800,1180 L980,1280 Z`, fill: ink }),
  // Neptune figure
  el('path', {
    d: `M775,1640 L770,1480 L780,1450 L800,1440 L820,1450 L830,1480 L825,1640 Z`,
    fill: accent,
    opacity: '0.7',
  }),
  el('circle', { cx: 800, cy: 1430, r: 28, fill: accent, opacity: '0.7' }),
  // Horses
  el('path', { d: `M640,1840 L640,1600 Q640,1540 700,1540 L760,1540 L760,1840 Z`, fill: ink }),
  el('path', { d: `M840,1840 L840,1540 L900,1540 Q960,1540 960,1600 L960,1840 Z`, fill: ink }),
  // Waterfall basin
  el('path', { d: `M380,1840 Q800,1760 1220,1840 L1220,1840 L380,1840 Z`, fill: accent, opacity: '0.3' }),
  el('ellipse', { cx: 800, cy: 1830, rx: 440, ry: 50, fill: accent, opacity: '0.3' }),
  // Steps
  el('path', { d: `M420,1840 L430,1800 L1170,1800 L1180,1840 Z`, fill: ink, opacity: '0.5' }),
]

// ─── TURKEY ───────────────────────────────────────────────────────────────────
const hagiaSophia = (ink, accent) => [
  // Base walls
  el('rect', { x: 380, y: 1620, width: 840, height: 220, fill: ink }),
  // Main dome
  el('ellipse', { cx: 800, cy: 1620, rx: 320, ry: 180, fill: ink }),
  el('rect', { x: 480, y: 1440, width: 640, height: 180, fill: ink }),
  // Semi-domes
  el('path', { d: `M480,1620 Q380,1620 380,1520 Q380,1440 480,1440 L480,1620 Z`, fill: ink }),
  el('path', { d: `M1120,1620 Q1220,1620 1220,1520 Q1220,1440 1120,1440 L1120,1620 Z`, fill: ink }),
  // Minarets — four
  el('rect', { x: 370, y: 1100, width: 40, height: 540, fill: ink }),
  el('path', { d: `M370,1100 L390,1040 L410,1100 Z`, fill: ink }),
  el('rect', { x: 1190, y: 1100, width: 40, height: 540, fill: ink }),
  el('path', { d: `M1190,1100 L1210,1040 L1230,1100 Z`, fill: ink }),
  el('rect', { x: 440, y: 1180, width: 36, height: 460, fill: ink }),
  el('path', { d: `M440,1180 L458,1120 L476,1180 Z`, fill: ink }),
  el('rect', { x: 1124, y: 1180, width: 36, height: 460, fill: ink }),
  el('path', { d: `M1124,1180 L1142,1120 L1160,1180 Z`, fill: ink }),
  // Crescent on dome
  el('path', { d: `M800,1445 Q820,1430 840,1445 Q820,1460 800,1445 Z`, fill: accent }),
  el('circle', { cx: 813, cy: 1438, r: 10, fill: accent }),
  // Window row
  ...Array.from({ length: 5 }, (_, i) => el('ellipse', { cx: 560 + i * 140, cy: 1660, rx: 25, ry: 40, fill: accent, opacity: '0.3' })),
]

const cappadocia = (ink, accent) => [
  // Fairy chimneys
  ...([
    [560, 1840, 80, 380],
    [680, 1840, 70, 320],
    [800, 1840, 90, 420],
    [940, 1840, 75, 350],
    [1060, 1840, 65, 300],
    [440, 1840, 60, 260],
    [1170, 1840, 60, 250],
  ].map(([cx, base, w, h]) => [
    el('path', {
      d: `M${cx - w / 2},${base} L${cx - w / 4},${base - h * 0.7} Q${cx},${base - h} ${cx + w / 4},${base - h * 0.7} L${cx + w / 2},${base} Z`,
      fill: ink,
    }),
    el('ellipse', { cx, cy: base - h, rx: w / 3, ry: w / 3, fill: ink }),
  ])).flat(),
  // Hot air balloons
  el('ellipse', { cx: 650, cy: 1250, rx: 70, ry: 90, fill: accent, opacity: '0.8' }),
  el('rect', { x: 640, y: 1340, width: 20, height: 40, fill: accent, opacity: '0.6' }),
  el('rect', { x: 635, y: 1375, width: 30, height: 18, fill: accent, opacity: '0.5' }),
  el('ellipse', { cx: 960, cy: 1190, rx: 65, ry: 82, fill: ink, opacity: '0.7' }),
  el('rect', { x: 950, y: 1272, width: 20, height: 38, fill: ink, opacity: '0.6' }),
  el('rect', { x: 945, y: 1305, width: 30, height: 16, fill: ink, opacity: '0.5' }),
  el('ellipse', { cx: 800, cy: 1140, rx: 58, ry: 72, fill: accent, opacity: '0.5' }),
  el('rect', { x: 791, y: 1210, width: 18, height: 34, fill: accent, opacity: '0.4' }),
]

const galataKule = (ink, accent) => [
  // Base
  el('rect', { x: 680, y: 1780, width: 240, height: 60, fill: ink }),
  // Lower cylinder
  el('rect', { x: 700, y: 1400, width: 200, height: 380, fill: ink }),
  // Wider section
  el('rect', { x: 680, y: 1550, width: 240, height: 100, fill: ink }),
  el('rect', { x: 660, y: 1380, width: 280, height: 60, fill: ink }),
  // Upper cylinder
  el('rect', { x: 710, y: 1220, width: 180, height: 160, fill: ink }),
  el('rect', { x: 695, y: 1200, width: 210, height: 30, fill: ink }),
  // Conical roof
  el('path', { d: `M695,1200 L800,1060 L905,1200 Z`, fill: ink }),
  // Pointed tip
  el('rect', { x: 797, y: 1030, width: 6, height: 35, fill: accent }),
  el('circle', { cx: 800, cy: 1026, r: 8, fill: accent }),
  // Windows
  ...Array.from({ length: 4 }, (_, i) => el('rect', { x: 740, y: 1430 + i * 80, width: 50, height: 35, fill: accent, opacity: '0.3' })),
  el('circle', { cx: 800, cy: 1250, r: 30, fill: accent, opacity: '0.3' }),
]

// ─── MEXICO ───────────────────────────────────────────────────────────────────
const chichenItza = (ink, accent) => [
  // Base/ground
  el('rect', { x: 320, y: 1820, width: 960, height: 20, fill: ink }),
  // Pyramid tier 4 (base)
  el('path', { d: `M280,1820 L480,1680 L1120,1680 L1320,1820 Z`, fill: ink }),
  el('rect', { x: 480, y: 1680, width: 640, height: 20, fill: accent, opacity: '0.3' }),
  // Tier 3
  el('path', { d: `M480,1680 L620,1560 L980,1560 L1120,1680 Z`, fill: ink }),
  el('rect', { x: 620, y: 1560, width: 360, height: 18, fill: accent, opacity: '0.3' }),
  // Tier 2
  el('path', { d: `M620,1560 L720,1450 L880,1450 L980,1560 Z`, fill: ink }),
  el('rect', { x: 720, y: 1450, width: 160, height: 18, fill: accent, opacity: '0.3' }),
  // Tier 1
  el('path', { d: `M720,1450 L780,1350 L820,1350 L880,1450 Z`, fill: ink }),
  el('rect', { x: 780, y: 1350, width: 40, height: 18, fill: accent, opacity: '0.3' }),
  // Temple top
  el('rect', { x: 760, y: 1240, width: 80, height: 115, fill: ink }),
  // Temple roof crest
  el('rect', { x: 745, y: 1200, width: 110, height: 45, fill: ink }),
  el('path', { d: `M755,1200 L800,1130 L845,1200 Z`, fill: ink }),
  // Central stairway (front)
  el('path', { d: `M778,1840 L780,1350 L820,1350 L822,1840 Z`, fill: accent, opacity: '0.2' }),
  // Serpent head at base
  el('ellipse', { cx: 780, cy: 1830, rx: 25, ry: 18, fill: ink }),
  el('ellipse', { cx: 820, cy: 1830, rx: 25, ry: 18, fill: ink }),
]

const angelIndependencia = (ink, accent) => [
  // Column base steps
  el('rect', { x: 700, y: 1810, width: 200, height: 30, fill: ink }),
  el('rect', { x: 720, y: 1785, width: 160, height: 25, fill: ink }),
  el('rect', { x: 740, y: 1760, width: 120, height: 25, fill: ink }),
  // Column shaft
  el('rect', { x: 768, y: 1200, width: 64, height: 560, fill: ink }),
  // Capitals
  el('rect', { x: 750, y: 1180, width: 100, height: 25, fill: ink }),
  el('rect', { x: 756, y: 1155, width: 88, height: 30, fill: ink }),
  // Angel figure
  el('path', {
    d: `M790,1145 L790,1060 L800,1050 L810,1060 L810,1145 Z`,
    fill: accent,
  }),
  el('circle', { cx: 800, cy: 1040, r: 22, fill: accent }),
  // Wings
  el('path', { d: `M790,1090 L720,1040 L740,1060 L790,1100 Z`, fill: accent }),
  el('path', { d: `M810,1090 L880,1040 L860,1060 L810,1100 Z`, fill: accent }),
  // Torch
  el('rect', { x: 820, y: 1025, width: 8, height: 35, fill: accent }),
  el('ellipse', { cx: 824, cy: 1020, rx: 10, ry: 15, fill: accent }),
  // Flutings on column
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 772 + i * 12, y: 1200, width: 3, height: 550, fill: accent, opacity: '0.15' })),
]

const teotihuacan = (ink, accent) => [
  // Avenue / ground
  el('rect', { x: 0, y: 1820, width: 1600, height: 20, fill: ink, opacity: '0.4' }),
  // Pyramid of Sun (center, large)
  el('path', { d: `M260,1820 L460,1560 L700,1560 L900,1820 Z`, fill: ink }),
  el('path', { d: `M460,1560 L560,1440 L600,1440 L700,1560 Z`, fill: ink }),
  el('path', { d: `M560,1440 L580,1380 L620,1380 L640,1440 Z`, fill: ink }),
  // Temple top
  el('rect', { x: 570, y: 1330, width: 60, height: 55, fill: ink }),
  // Pyramid of Moon (right, smaller)
  el('path', { d: `M1000,1820 L1120,1620 L1260,1620 L1380,1820 Z`, fill: ink }),
  el('path', { d: `M1120,1620 L1170,1510 L1210,1510 L1260,1620 Z`, fill: ink }),
  el('path', { d: `M1170,1510 L1185,1460 L1215,1460 L1230,1510 Z`, fill: ink }),
  el('rect', { x: 1180, y: 1415, width: 40, height: 50, fill: ink }),
  // Terrace accents
  el('rect', { x: 460, y: 1558, width: 240, height: 10, fill: accent, opacity: '0.4' }),
  el('rect', { x: 560, y: 1438, width: 80, height: 8, fill: accent, opacity: '0.4' }),
  el('rect', { x: 1120, y: 1618, width: 140, height: 8, fill: accent, opacity: '0.4' }),
  // Quetzalcoatl small structure
  el('rect', { x: 200, y: 1760, width: 120, height: 60, fill: ink }),
  el('path', { d: `M200,1760 L260,1700 L320,1760 Z`, fill: ink }),
]

// ─── UNITED KINGDOM ───────────────────────────────────────────────────────────
const bigBen = (ink, accent) => [
  // Base plinth
  el('rect', { x: 700, y: 1790, width: 200, height: 50, fill: ink }),
  // Main tower shaft
  el('rect', { x: 720, y: 1200, width: 160, height: 590, fill: ink }),
  // Buttress corners
  el('rect', { x: 710, y: 1300, width: 20, height: 490, fill: ink }),
  el('rect', { x: 870, y: 1300, width: 20, height: 490, fill: ink }),
  // Belfry stage
  el('rect', { x: 705, y: 1190, width: 190, height: 80, fill: ink }),
  // Clock stage
  el('rect', { x: 710, y: 1100, width: 180, height: 95, fill: ink }),
  // Clock faces — four sides (just show 2)
  el('circle', { cx: 800, cy: 1148, r: 55, fill: accent, opacity: '0.7' }),
  el('circle', { cx: 800, cy: 1148, r: 45, fill: accent, opacity: '0.4' }),
  // Clock hands
  el('line', { x1: 800, y1: 1148, x2: 800, y2: 1100, stroke: ink, strokeWidth: 4 }),
  el('line', { x1: 800, y1: 1148, x2: 840, y2: 1155, stroke: ink, strokeWidth: 3 }),
  // Gothic spire roof
  el('path', { d: `M705,1100 L800,960 L895,1100 Z`, fill: ink }),
  // Pinnacles
  el('rect', { x: 700, y: 1080, width: 16, height: 30, fill: ink }),
  el('path', { d: `M700,1080 L708,1050 L716,1080 Z`, fill: ink }),
  el('rect', { x: 884, y: 1080, width: 16, height: 30, fill: ink }),
  el('path', { d: `M884,1080 L892,1050 L900,1080 Z`, fill: ink }),
  // Flag
  el('rect', { x: 800, y: 960, width: 3, height: 30, fill: accent }),
  el('path', { d: `M803,960 L840,972 L803,984 Z`, fill: accent }),
  // Gothic windows
  ...Array.from({ length: 3 }, (_, i) => [
    el('rect', { x: 735, y: 1370 + i * 130, width: 40, height: 70, fill: accent, opacity: '0.25' }),
    el('path', { d: `M735,${1370 + i * 130} Q755,${1350 + i * 130} 775,${1370 + i * 130}`, fill: accent, opacity: '0.25' }),
    el('rect', { x: 825, y: 1370 + i * 130, width: 40, height: 70, fill: accent, opacity: '0.25' }),
  ]).flat(),
]

const towerBridge = (ink, accent) => [
  // Thames base
  el('rect', { x: 0, y: 1800, width: 1600, height: 40, fill: ink, opacity: '0.3' }),
  // Left tower base
  el('rect', { x: 300, y: 1680, width: 220, height: 160, fill: ink }),
  // Left tower middle
  el('rect', { x: 320, y: 1380, width: 180, height: 300, fill: ink }),
  // Left tower upper
  el('rect', { x: 310, y: 1260, width: 200, height: 120, fill: ink }),
  // Left tower roof
  el('path', { d: `M310,1260 L410,1160 L510,1260 Z`, fill: ink }),
  el('path', { d: `M340,1260 L410,1190 L480,1260 Z`, fill: ink }),
  // Right tower base
  el('rect', { x: 1080, y: 1680, width: 220, height: 160, fill: ink }),
  el('rect', { x: 1100, y: 1380, width: 180, height: 300, fill: ink }),
  el('rect', { x: 1090, y: 1260, width: 200, height: 120, fill: ink }),
  el('path', { d: `M1090,1260 L1190,1160 L1290,1260 Z`, fill: ink }),
  // High-level walkway
  el('rect', { x: 510, y: 1310, width: 580, height: 30, fill: ink }),
  // Suspension cables
  el('path', { d: `M410,1210 Q600,1420 800,1450 Q1000,1420 1190,1210`, fill: 'none', stroke: ink, strokeWidth: 8 }),
  // Bascule bridge (closed)
  el('rect', { x: 510, y: 1755, width: 290, height: 45, fill: ink }),
  el('rect', { x: 800, y: 1755, width: 290, height: 45, fill: ink }),
  // Road deck supports
  el('rect', { x: 410, y: 1800, width: 100, height: 40, fill: ink }),
  el('rect', { x: 1090, y: 1800, width: 100, height: 40, fill: ink }),
  // Victorian detail
  el('rect', { x: 350, y: 1380, width: 120, height: 18, fill: accent, opacity: '0.3' }),
  el('rect', { x: 1130, y: 1380, width: 120, height: 18, fill: accent, opacity: '0.3' }),
]

const stonehenge = (ink, accent) => [
  // Grass mound suggestion
  el('ellipse', { cx: 800, cy: 1840, rx: 600, ry: 40, fill: ink, opacity: '0.3' }),
  // Outer standing stones - simplified circle
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
    const r = 440
    const cx = Math.round(800 + r * Math.cos(angle))
    const visibleY = Math.round(1840 + r * 0.18 * Math.sin(angle))
    const h = 190 + Math.round(40 * Math.sin(angle + Math.PI / 2))
    return el('rect', { x: cx - 22, y: visibleY - h, width: 44, height: h, fill: ink })
  }),
  // Outer lintels (connecting tops of certain pairs)
  ...[0, 1, 2, 3, 4, 5].map(i => {
    const a1 = (i * 2 / 12) * Math.PI * 2 - Math.PI / 2
    const a2 = ((i * 2 + 1) / 12) * Math.PI * 2 - Math.PI / 2
    const r = 440
    const x1 = Math.round(800 + r * Math.cos(a1))
    const x2 = Math.round(800 + r * Math.cos(a2))
    const y1 = Math.round(1840 + r * 0.18 * Math.sin(a1)) - 180
    const y2 = Math.round(1840 + r * 0.18 * Math.sin(a2)) - 170
    return el('path', { d: `M${x1 - 22},${y1} L${x2 + 22},${y2} L${x2 + 22},${y2 - 45} L${x1 - 22},${y1 - 45} Z`, fill: ink })
  }),
  // Inner horseshoe trilithons
  ...[0, 1, 2, 3, 4].map(i => {
    const angle = (i / 5) * Math.PI - Math.PI * 0.1
    const r = 240
    const cx = Math.round(800 + r * Math.cos(angle))
    const cy = 1840
    return [
      el('rect', { x: cx - 50, y: cy - 300, width: 42, height: 300, fill: ink }),
      el('rect', { x: cx + 8, y: cy - 290, width: 42, height: 290, fill: ink }),
      el('rect', { x: cx - 55, y: cy - 305, width: 105, height: 45, fill: ink }),
    ]
  }).flat(),
  // Altar stone
  el('ellipse', { cx: 800, cy: 1835, rx: 55, ry: 18, fill: accent, opacity: '0.5' }),
]

// ─── GERMANY ─────────────────────────────────────────────────────────────────
const neuschwanstein = (ink, accent) => [
  // Rocky hill base
  el('path', { d: `M300,1840 Q500,1760 800,1740 Q1100,1760 1300,1840 Z`, fill: ink, opacity: '0.5' }),
  // Main keep
  el('rect', { x: 680, y: 1320, width: 240, height: 420, fill: ink }),
  // Keep battlements
  ...Array.from({ length: 8 }, (_, i) => el('rect', { x: 683 + i * 29, y: 1300, width: 18, height: 24, fill: ink })),
  // Left wing
  el('rect', { x: 440, y: 1440, width: 240, height: 400, fill: ink }),
  el('rect', { x: 440, y: 1420, width: 240, height: 24, fill: ink }),
  // Right wing
  el('rect', { x: 920, y: 1460, width: 220, height: 380, fill: ink }),
  el('rect', { x: 920, y: 1440, width: 220, height: 24, fill: ink }),
  // Main tower cylinder
  el('rect', { x: 745, y: 1100, width: 110, height: 240, fill: ink }),
  el('path', { d: `M745,1100 L800,980 L855,1100 Z`, fill: ink }),
  // Keep round tower
  el('rect', { x: 625, y: 1200, width: 80, height: 480, fill: ink }),
  el('path', { d: `M625,1200 L665,1120 L705,1200 Z`, fill: ink }),
  // Right tower
  el('rect', { x: 900, y: 1240, width: 75, height: 440, fill: ink }),
  el('path', { d: `M900,1240 L937,1170 L975,1240 Z`, fill: ink }),
  // Balcony
  el('rect', { x: 680, y: 1480, width: 240, height: 20, fill: accent, opacity: '0.4' }),
  // Windows
  ...Array.from({ length: 4 }, (_, i) => el('rect', { x: 700, y: 1370 + i * 90, width: 50, height: 70, fill: accent, opacity: '0.25' })),
  ...Array.from({ length: 4 }, (_, i) => el('rect', { x: 830, y: 1370 + i * 90, width: 50, height: 70, fill: accent, opacity: '0.25' })),
]

const brandenburgGate = (ink, accent) => [
  // Base stylobate
  el('rect', { x: 340, y: 1780, width: 920, height: 60, fill: ink }),
  // Attic top block
  el('rect', { x: 340, y: 1500, width: 920, height: 100, fill: ink }),
  // Attic relief
  el('rect', { x: 360, y: 1510, width: 880, height: 35, fill: accent, opacity: '0.2' }),
  // Five passage openings (columns implied)
  ...Array.from({ length: 6 }, (_, i) => el('rect', { x: 380 + i * 140, y: 1600, width: 60, height: 180, fill: ink })),
  // Spaces between columns
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 440 + i * 140, y: 1600, width: 80, height: 180, fill: 'currentColor', opacity: '0' })),
  // Side pylons
  el('rect', { x: 340, y: 1380, width: 130, height: 400, fill: ink }),
  el('rect', { x: 1130, y: 1380, width: 130, height: 400, fill: ink }),
  // Quadriga platform
  el('rect', { x: 460, y: 1460, width: 680, height: 50, fill: ink }),
  // Quadriga horses silhouette
  el('path', { d: `M500,1460 L530,1380 L560,1430 L600,1370 L640,1430 L680,1380 L720,1440 L760,1380 L800,1440 L840,1380 L880,1440 L920,1370 L960,1430 L1000,1380 L1030,1430 L1060,1460 Z`, fill: ink }),
  // Victoria figure
  el('path', { d: `M788,1375 L800,1290 L812,1375 Z`, fill: accent }),
  el('circle', { cx: 800, cy: 1282, r: 22, fill: accent }),
  // Wings
  el('path', { d: `M788,1330 L740,1295 L760,1310 L788,1345 Z`, fill: accent }),
  el('path', { d: `M812,1330 L860,1295 L840,1310 L812,1345 Z`, fill: accent }),
]

const cologneKathedrale = (ink, accent) => [
  // Base
  el('rect', { x: 460, y: 1780, width: 680, height: 60, fill: ink }),
  // Nave body
  el('rect', { x: 540, y: 1380, width: 520, height: 400, fill: ink }),
  // Twin towers flanking
  el('rect', { x: 460, y: 1100, width: 200, height: 740, fill: ink }),
  el('rect', { x: 940, y: 1100, width: 200, height: 740, fill: ink }),
  // Tower spires
  el('path', { d: `M460,1100 L560,890 L660,1100 Z`, fill: ink }),
  el('path', { d: `M940,1100 L1040,890 L1140,1100 Z`, fill: ink }),
  // Flying buttresses
  el('path', { d: `M540,1600 L460,1550 L460,1570 L540,1620 Z`, fill: ink }),
  el('path', { d: `M1060,1600 L1140,1550 L1140,1570 L1060,1620 Z`, fill: ink }),
  // Gothic window rose
  el('circle', { cx: 800, cy: 1470, r: 80, fill: accent, opacity: '0.3' }),
  el('circle', { cx: 800, cy: 1470, r: 55, fill: accent, opacity: '0.25' }),
  // Lancet windows
  ...Array.from({ length: 5 }, (_, i) => [
    el('rect', { x: 545 + i * 100, y: 1560, width: 50, height: 120, fill: accent, opacity: '0.2' }),
    el('path', { d: `M${545 + i * 100},1560 Q${570 + i * 100},1530 ${595 + i * 100},1560`, fill: accent, opacity: '0.2' }),
  ]).flat(),
  // Tower windows
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 490, y: 1130 + i * 120, width: 40, height: 90, fill: accent, opacity: '0.2' })),
  ...Array.from({ length: 5 }, (_, i) => el('rect', { x: 1070, y: 1130 + i * 120, width: 40, height: 90, fill: accent, opacity: '0.2' })),
  // Finials
  el('rect', { x: 556, y: 888, width: 8, height: 30, fill: accent }),
  el('rect', { x: 1036, y: 888, width: 8, height: 30, fill: accent }),
]

// ─── JAPAN ────────────────────────────────────────────────────────────────────
const mountFuji = (ink, accent) => [
  // Mountain silhouette
  el('path', {
    d: `M100,1840 L800,1120 L1500,1840 Z`,
    fill: ink,
  }),
  // Snow cap
  el('path', {
    d: `M800,1120 L690,1330 Q750,1290 800,1310 Q850,1290 910,1330 Z`,
    fill: accent,
  }),
  // Crater dip
  el('path', { d: `M800,1120 L785,1165 L815,1165 Z`, fill: accent, opacity: '0.5' }),
  // Treeline
  el('path', {
    d: `M250,1840 Q400,1770 600,1780 Q800,1800 1000,1780 Q1200,1770 1350,1840 Z`,
    fill: ink,
    opacity: '0.5',
  }),
  // Torii gate silhouette at base
  el('rect', { x: 760, y: 1740, width: 80, height: 100, fill: 'none' }),
]

const toriiGate = (ink, accent) => [
  // Ground
  el('rect', { x: 200, y: 1820, width: 1200, height: 20, fill: ink, opacity: '0.3' }),
  // Main torii
  el('rect', { x: 680, y: 1280, width: 60, height: 560, fill: ink }),
  el('rect', { x: 860, y: 1280, width: 60, height: 560, fill: ink }),
  // Kasagi (top curved lintel)
  el('path', { d: `M620,1290 Q800,1230 980,1290 L980,1340 Q800,1280 620,1340 Z`, fill: ink }),
  // Nuki (second crossbar)
  el('rect', { x: 680, y: 1390, width: 240, height: 38, fill: ink }),
  // Shimaki (cap extension)
  el('path', { d: `M600,1270 Q800,1200 1000,1270 L1000,1295 Q800,1225 600,1295 Z`, fill: ink }),
  // Column bases
  el('rect', { x: 665, y: 1820, width: 90, height: 20, fill: ink }),
  el('rect', { x: 845, y: 1820, width: 90, height: 20, fill: ink }),
  // Additional smaller torii in background
  el('rect', { x: 390, y: 1490, width: 35, height: 350, fill: ink, opacity: '0.4' }),
  el('rect', { x: 480, y: 1490, width: 35, height: 350, fill: ink, opacity: '0.4' }),
  el('path', { d: `M370,1500 Q462,1468 528,1500 L528,1520 Q462,1488 370,1520 Z`, fill: ink, opacity: '0.4' }),
  el('rect', { x: 1095, y: 1490, width: 35, height: 350, fill: ink, opacity: '0.4' }),
  el('rect', { x: 1185, y: 1490, width: 35, height: 350, fill: ink, opacity: '0.4' }),
  el('path', { d: `M1075,1500 Q1167,1468 1233,1500 L1233,1520 Q1167,1488 1075,1520 Z`, fill: ink, opacity: '0.4' }),
  // Color accent on top caps
  el('path', { d: `M600,1265 Q800,1195 1000,1265 L1000,1275 Q800,1205 600,1275 Z`, fill: accent }),
]

const sensojiTemple = (ink, accent) => [
  // Base platform
  el('rect', { x: 400, y: 1760, width: 800, height: 80, fill: ink }),
  // Main hall
  el('rect', { x: 500, y: 1520, width: 600, height: 240, fill: ink }),
  // Main hall curved roof
  el('path', { d: `M440,1520 Q800,1400 1160,1520 L1120,1540 Q800,1430 480,1540 Z`, fill: ink }),
  el('path', { d: `M440,1520 Q800,1390 1160,1520 L1140,1510 Q800,1400 460,1510 Z`, fill: accent, opacity: '0.3' }),
  // Roof ridge
  el('rect', { x: 600, y: 1395, width: 400, height: 18, fill: ink }),
  // Roof finials
  el('path', { d: `M580,1510 L600,1395 L640,1410 Z`, fill: ink }),
  el('path', { d: `M1020,1510 L1000,1395 L960,1410 Z`, fill: ink }),
  // Front porch
  el('rect', { x: 520, y: 1640, width: 560, height: 120, fill: ink, opacity: '0.6' }),
  el('path', { d: `M480,1640 Q800,1570 1120,1640 L1100,1660 Q800,1590 500,1660 Z`, fill: ink }),
  // Five-story pagoda (right)
  el('rect', { x: 1050, y: 1280, width: 130, height: 480, fill: ink }),
  ...Array.from({ length: 5 }, (_, i) => [
    el('path', { d: `M${1010 + i * 10},${1530 - i * 110} Q1115,${1490 - i * 110} ${1220 - i * 10},${1530 - i * 110} L${1210 - i * 10},${1545 - i * 110} Q1115,${1505 - i * 110} ${1020 + i * 10},${1545 - i * 110} Z`, fill: ink }),
    el('path', { d: `M${1010 + i * 10},${1528 - i * 110} Q1115,${1487 - i * 110} ${1220 - i * 10},${1528 - i * 110} L${1210 - i * 10},${1533 - i * 110} Q1115,${1492 - i * 110} ${1020 + i * 10},${1533 - i * 110} Z`, fill: accent, opacity: '0.35' }),
  ]).flat(),
  el('path', { d: `M1065,1280 L1115,1190 L1165,1280 Z`, fill: ink }),
  el('rect', { x: 1111, y: 1160, width: 8, height: 35, fill: accent }),
  // Lantern
  el('rect', { x: 770, y: 1620, width: 60, height: 100, fill: accent, opacity: '0.5' }),
  el('ellipse', { cx: 800, cy: 1618, rx: 40, ry: 18, fill: accent, opacity: '0.5' }),
]

// ─── GREECE ───────────────────────────────────────────────────────────────────
const parthenon = (ink, accent) => [
  // Stylobate (stepped base)
  el('rect', { x: 280, y: 1810, width: 1040, height: 30, fill: ink }),
  el('rect', { x: 300, y: 1780, width: 1000, height: 30, fill: ink }),
  el('rect', { x: 320, y: 1750, width: 960, height: 30, fill: ink }),
  // Colonnade — 8 columns front
  ...Array.from({ length: 8 }, (_, i) =>
    el('rect', { x: 335 + i * 118, y: 1400, width: 52, height: 350, fill: ink })
  ),
  // Entablature (architrave + frieze)
  el('rect', { x: 310, y: 1350, width: 980, height: 55, fill: ink }),
  el('rect', { x: 310, y: 1320, width: 980, height: 35, fill: ink }),
  // Metopes hint
  ...Array.from({ length: 7 }, (_, i) => el('rect', { x: 330 + i * 130, y: 1323, width: 70, height: 30, fill: accent, opacity: '0.3' })),
  // Pediment
  el('path', { d: `M310,1320 L800,1140 L1290,1320 Z`, fill: ink }),
  el('path', { d: `M350,1320 L800,1155 L1250,1320 Z`, fill: accent, opacity: '0.2' }),
  // Pediment sculptures hint
  el('circle', { cx: 800, cy: 1220, r: 35, fill: accent, opacity: '0.35' }),
  el('path', { d: `M760,1275 Q800,1220 840,1275`, fill: 'none', stroke: accent, strokeWidth: 12, opacity: '0.3' }),
  // Inner cella columns (partial)
  el('rect', { x: 420, y: 1400, width: 35, height: 350, fill: accent, opacity: '0.25' }),
  el('rect', { x: 1145, y: 1400, width: 35, height: 350, fill: accent, opacity: '0.25' }),
  // Cella wall
  el('rect', { x: 460, y: 1500, width: 680, height: 250, fill: ink, opacity: '0.5' }),
]

const santorini = (ink, accent) => [
  // Cliff face
  el('path', { d: `M0,1840 L0,1500 Q200,1400 400,1450 Q600,1500 800,1480 Q1000,1460 1200,1500 Q1400,1540 1600,1480 L1600,1840 Z`, fill: ink }),
  // White buildings cascade
  el('rect', { x: 200, y: 1360, width: 200, height: 150, fill: accent }),
  el('rect', { x: 350, y: 1310, width: 180, height: 200, fill: accent }),
  el('rect', { x: 480, y: 1280, width: 160, height: 230, fill: accent }),
  el('rect', { x: 590, y: 1250, width: 140, height: 260, fill: accent }),
  // Blue domed church
  el('rect', { x: 700, y: 1300, width: 120, height: 210, fill: accent }),
  el('ellipse', { cx: 760, cy: 1295, rx: 60, ry: 50, fill: ink }),
  el('rect', { x: 755, y: 1245, width: 10, height: 55, fill: accent }),
  el('path', { d: `M740,1248 Q760,1230 780,1248`, fill: accent }),
  // More buildings right
  el('rect', { x: 850, y: 1270, width: 130, height: 240, fill: accent }),
  el('rect', { x: 950, y: 1300, width: 120, height: 210, fill: accent }),
  el('ellipse', { cx: 1010, cy: 1295, rx: 55, ry: 45, fill: ink }),
  el('rect', { x: 1040, y: 1310, width: 110, height: 200, fill: accent }),
  el('rect', { x: 1120, y: 1360, width: 100, height: 150, fill: accent }),
  // Windows
  ...Array.from({ length: 6 }, (_, i) => el('rect', { x: 230 + i * 160, y: 1380 - i * 20, width: 30, height: 30, fill: ink, opacity: '0.35' })),
  // Caldera water reflection
  el('rect', { x: 0, y: 1790, width: 200, height: 50, fill: ink, opacity: '0.4' }),
]

const mykonosWindmills = (ink, accent) => [
  // Hill
  el('path', { d: `M0,1840 Q400,1740 800,1720 Q1200,1740 1600,1840 Z`, fill: ink, opacity: '0.4' }),
  // Three windmills
  ...[560, 800, 1040].map((cx, mi) => [
    // Tower body
    el('path', { d: `M${cx - 55},1840 L${cx - 40},1440 L${cx + 40},1440 L${cx + 55},1840 Z`, fill: mi === 1 ? ink : (mi === 0 ? ink : ink) }),
    // Cap
    el('ellipse', { cx, cy: 1440, rx: 50, ry: 35, fill: ink }),
    el('path', { d: `M${cx - 50},1440 L${cx},1320 L${cx + 50},1440 Z`, fill: ink }),
    // Sails (X cross)
    el('line', { x1: cx, y1: 1420, x2: cx - 120, y2: 1320, stroke: ink, strokeWidth: 14 }),
    el('line', { x1: cx, y1: 1420, x2: cx + 120, y2: 1320, stroke: ink, strokeWidth: 14 }),
    el('line', { x1: cx, y1: 1420, x2: cx - 80, y2: 1560, stroke: ink, strokeWidth: 10 }),
    el('line', { x1: cx, y1: 1420, x2: cx + 80, y2: 1560, stroke: ink, strokeWidth: 10 }),
    // Hub
    el('circle', { cx, cy: 1420, r: 16, fill: accent }),
    // Door
    el('path', { d: `M${cx - 16},1840 L${cx - 16},1750 Q${cx},1720 ${cx + 16},1750 L${cx + 16},1840 Z`, fill: accent, opacity: '0.5' }),
    // Windows
    el('circle', { cx, cy: 1600, r: 18, fill: accent, opacity: '0.4' }),
    el('circle', { cx, cy: 1700, r: 16, fill: accent, opacity: '0.4' }),
  ]).flat(),
  // Sea hint
  el('rect', { x: 0, y: 1810, width: 200, height: 30, fill: ink, opacity: '0.25' }),
  el('rect', { x: 1400, y: 1810, width: 200, height: 30, fill: ink, opacity: '0.25' }),
]

// ─────────────────────────────────────────────────────────────────────────────
// Countries data
// ─────────────────────────────────────────────────────────────────────────────

export const COUNTRIES = [
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    monuments: [
      { id: 'eiffel', name: 'Eiffel Tower', elements: eiffelTower },
      { id: 'arc', name: 'Arc de Triomphe', elements: arcDeTriomphe },
      { id: 'versailles', name: 'Palace of Versailles', elements: versaillesPalace },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Tricolore', background: '#E8ECF5', ink: '#002395', year: '#ED2939' },
    ],
  },
  {
    id: 'spain',
    name: 'Spain',
    flag: '🇪🇸',
    monuments: [
      { id: 'sagrada', name: 'Sagrada Família', elements: sagradaFamilia },
      { id: 'alhambra', name: 'Alhambra', elements: alhambra },
      { id: 'plaza', name: 'Plaza de España', elements: plazaEspana },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Iberian Sun', background: '#FDF3C0', ink: '#AA151B', year: '#F1BF00' },
    ],
  },
  {
    id: 'usa',
    name: 'United States',
    flag: '🇺🇸',
    monuments: [
      { id: 'liberty', name: 'Statue of Liberty', elements: statuOfLiberty },
      { id: 'canyon', name: 'Grand Canyon', elements: grandCanyon },
      { id: 'empire', name: 'Empire State Building', elements: empireSateBuilding },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Stars & Stripes', background: '#E8ECF5', ink: '#B22234', year: '#3C3B6E' },
    ],
  },
  {
    id: 'italy',
    name: 'Italy',
    flag: '🇮🇹',
    monuments: [
      { id: 'colosseum', name: 'Colosseum', elements: colosseum },
      { id: 'pisa', name: 'Leaning Tower of Pisa', elements: leaningTowerPisa },
      { id: 'trevi', name: 'Trevi Fountain', elements: treviFountain },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Tricolore Verde', background: '#E8F5EE', ink: '#009246', year: '#CE2B37' },
    ],
  },
  {
    id: 'turkey',
    name: 'Turkey',
    flag: '🇹🇷',
    monuments: [
      { id: 'hagia', name: 'Hagia Sophia', elements: hagiaSophia },
      { id: 'cappadocia', name: 'Cappadocia', elements: cappadocia },
      { id: 'galata', name: 'Galata Tower', elements: galataKule },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Crescent & Star', background: '#FFE8E8', ink: '#E30A17', year: '#7A0008' },
    ],
  },
  {
    id: 'mexico',
    name: 'Mexico',
    flag: '🇲🇽',
    monuments: [
      { id: 'chichen', name: 'Chichén Itzá', elements: chichenItza },
      { id: 'angel', name: 'Angel of Independence', elements: angelIndependencia },
      { id: 'teotihuacan', name: 'Teotihuacan', elements: teotihuacan },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Aztec Sun', background: '#E8F5EE', ink: '#006847', year: '#CE1126' },
    ],
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    monuments: [
      { id: 'bigben', name: 'Big Ben', elements: bigBen },
      { id: 'bridge', name: 'Tower Bridge', elements: towerBridge },
      { id: 'stonehenge', name: 'Stonehenge', elements: stonehenge },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Union Jack', background: '#E8ECF5', ink: '#012169', year: '#C8102E' },
    ],
  },
  {
    id: 'germany',
    name: 'Germany',
    flag: '🇩🇪',
    monuments: [
      { id: 'neuschwanstein', name: 'Neuschwanstein', elements: neuschwanstein },
      { id: 'brandenburg', name: 'Brandenburg Gate', elements: brandenburgGate },
      { id: 'cologne', name: 'Cologne Cathedral', elements: cologneKathedrale },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Eagle Standard', background: '#FFF9E0', ink: '#1A1A1A', year: '#DD0000' },
    ],
  },
  {
    id: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    monuments: [
      { id: 'fuji', name: 'Mount Fuji', elements: mountFuji },
      { id: 'torii', name: 'Torii Gate', elements: toriiGate },
      { id: 'sensoji', name: 'Sensō-ji Temple', elements: sensojiTemple },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Rising Sun', background: '#FFF5F5', ink: '#BC002D', year: '#660016' },
    ],
  },
  {
    id: 'greece',
    name: 'Greece',
    flag: '🇬🇷',
    monuments: [
      { id: 'parthenon', name: 'Parthenon', elements: parthenon },
      { id: 'santorini', name: 'Santorini', elements: santorini },
      { id: 'windmills', name: 'Mykonos Windmills', elements: mykonosWindmills },
    ],
    colorTemplates: [
      CLASSIC_TEMPLATE,
      { id: 'flag', name: 'Azure Aegean', background: '#E8F0FF', ink: '#0D5EAF', year: '#003F8A' },
    ],
  },
]

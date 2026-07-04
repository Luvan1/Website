# Duhok Drive

Free-roam 3D driving game set in **Duhok, Kurdistan Region of Iraq**, at
real-life scale (1 unit = 1 metre), in a Cadillac Escalade, with AI traffic.

**Play:** open `index.html` (or visit `/duhok-drive/` on the hosted site).

## How the map works

- On first load the game downloads the **genuine street network of Duhok from
  OpenStreetMap** (via the Overpass API) straight into your browser: every
  road, the dam lake, parks, rivers and real building footprints, all at their
  true positions and sizes. The download is a few MB and is then cached in
  your browser (IndexedDB), so later visits start instantly.
- Use the *"re-download the latest map data"* link on the start screen to
  refresh the cache after OpenStreetMap improves its coverage of Duhok.
- **If you are offline** the game falls back to a bundled approximation of the
  city (hand-built arterial roads anchored to verified coordinates). A warning
  badge tells you which map you're on. Reload with internet for the real map.

Landmarks (University of Duhok, Duhok Dam & Lake, Duhok Stadium, Azadi Park,
the Grand Bazaar & Mosque, the malls, Dream City, Gali Duhok gorge) are placed
at their real-world coordinates; positions marked *verified* in
`js/osm.js` were cross-checked against Wikipedia/OpenStreetMap, the rest are
close approximations. Their 3D models are stylised, not photorealistic.

## Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | drive |
| Space | handbrake |
| C | camera (chase / close / hood) |
| M | full city map |
| R | reset onto the nearest road |
| H | horn |

Touch controls appear automatically on phones/tablets.

## Tech

- `three.min.js` — three.js r185 (npm `three@0.185.1`, MIT — see
  `LICENSE-three.txt`), repackaged as a classic script so the game also runs
  from `file://`.
- `js/osm.js` — Overpass fetch, lat/lon → metres projection, IndexedDB cache.
- `js/fallback-map.js` — offline approximation of Duhok.
- `js/world.js` — terrain (Bêxêr & Zawa ridges, dam-lake bowl), road ribbons
  with lane markings, buildings, landmark models.
- `js/traffic.js` — road graph + AI drivers (right-hand traffic, braking,
  junction turns).
- `js/vehicles.js` — Escalade at true dimensions (5.38 × 2.06 × 1.94 m) and
  the traffic fleet.
- `js/main.js` — physics, chase camera, HUD, minimap, audio.

Debug helpers: `?offline=1` forces the bundled map, `?refresh=1` bypasses the
cache, `?overpass=<url>` points at a custom Overpass endpoint, and
`__DUHOK_TP__(lat, lon, bearing)` in the console teleports the car.

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright)
contributors, available under the Open Database License (ODbL).

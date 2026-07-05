/* ============================================================================
 * osm.js — Real-world map data for Duhok, Kurdistan Region of Iraq.
 *
 * Loads the genuine street network of Duhok from OpenStreetMap (Overpass API)
 * at true real-world scale: 1 world unit = 1 metre.  Downloaded data is cached
 * in IndexedDB so later visits start instantly.  If OSM cannot be reached the
 * game falls back to a bundled approximation of the city (see fallback-map.js).
 *
 * Coordinate system:  x = metres east of the anchor, z = metres SOUTH of the
 * anchor (three.js convention: north is -z, up is +y).
 * ==========================================================================*/
'use strict';

const OSM = (() => {

  // Projection anchor near Duhok city centre.
  const ANCHOR = { lat: 36.8600, lon: 42.9950 };
  // Metres per degree at latitude 36.86° (standard geodetic series).
  const M_PER_DEG_LAT = 110976;
  const M_PER_DEG_LON = 89174;

  // Area covered by the game: the whole Duhok valley, dam and outskirts.
  // south, west, north, east
  const BBOX = { s: 36.8180, w: 42.9000, n: 36.9200, e: 43.0600 };
  // Buildings are only fetched for the urban core (keeps download reasonable).
  const BBOX_BUILDINGS = { s: 36.8330, w: 42.9250, n: 36.8960, e: 43.0400 };

  const CACHE_KEY = 'duhok-city-v4';

  function project(lat, lon) {
    return {
      x: (lon - ANCHOR.lon) * M_PER_DEG_LON,
      z: -(lat - ANCHOR.lat) * M_PER_DEG_LAT
    };
  }
  function unproject(x, z) {
    return {
      lat: ANCHOR.lat - z / M_PER_DEG_LAT,
      lon: ANCHOR.lon + x / M_PER_DEG_LON
    };
  }

  /* ------------------------------------------------------------------------
   * Landmarks.  Positions are real-world coordinates.
   *   verified: cross-checked against Wikipedia / OpenStreetMap.
   *   approx:   placed from map knowledge; may be a few hundred metres off.
   * ----------------------------------------------------------------------*/
  const LANDMARKS = [
    { id: 'dam',      name: 'Duhok Dam & Lake',        lat: 36.8758, lon: 43.0036, verified: true,  kind: 'dam' },
    { id: 'stadium',  name: 'Duhok Stadium',           lat: 36.8519, lon: 42.9961, verified: true,  kind: 'stadium' },
    { id: 'uod',      name: 'University of Duhok',     lat: 36.8618, lon: 42.9869, verified: true,  kind: 'university' },
    { id: 'azadi',    name: 'Azadi Park',              lat: 36.8483, lon: 42.9967, verified: true,  kind: 'park' },
    { id: 'bazaar',   name: 'Grand Bazaar & Mosque',   lat: 36.8585, lon: 42.9930, verified: false, kind: 'bazaar' },
    { id: 'mazi',     name: 'Mazi Mall',               lat: 36.8600, lon: 42.9820, verified: false, kind: 'mall' },
    { id: 'family',   name: 'Family Mall',             lat: 36.8560, lon: 42.9480, verified: false, kind: 'mall' },
    { id: 'dmall',    name: 'Duhok Mall',              lat: 36.8710, lon: 42.9600, verified: false, kind: 'mall' },
    { id: 'dream',    name: 'Dream City',              lat: 36.8630, lon: 42.9300, verified: false, kind: 'dream' },
    { id: 'gali',     name: 'Gali Duhok Gorge',        lat: 36.8380, lon: 42.9890, verified: false, kind: 'gorge' },
  ];

  /* Road class table: rendered width (m), AI speed limit (km/h), dual carriageway */
  const ROAD_CLASSES = {
    motorway:       { w: 17, kph: 100, dual: true,  rank: 0 },
    motorway_link:  { w: 7,  kph: 50,  dual: false, rank: 1 },
    trunk:          { w: 16, kph: 90,  dual: true,  rank: 0 },
    trunk_link:     { w: 7,  kph: 50,  dual: false, rank: 1 },
    primary:        { w: 13, kph: 70,  dual: true,  rank: 1 },
    primary_link:   { w: 7,  kph: 45,  dual: false, rank: 2 },
    secondary:      { w: 10, kph: 60,  dual: false, rank: 2 },
    secondary_link: { w: 6.5,kph: 40,  dual: false, rank: 3 },
    tertiary:       { w: 8.5,kph: 50,  dual: false, rank: 3 },
    tertiary_link:  { w: 6,  kph: 40,  dual: false, rank: 3 },
    unclassified:   { w: 6.5,kph: 40,  dual: false, rank: 4 },
    residential:    { w: 6.5,kph: 35,  dual: false, rank: 4 },
    living_street:  { w: 5.5,kph: 20,  dual: false, rank: 5 },
    service:        { w: 4.5,kph: 25,  dual: false, rank: 6 },
  };
  const HIGHWAY_REGEX = Object.keys(ROAD_CLASSES).filter(k => k !== 'service').join('|');

  const MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.osm.jp/api/interpreter',
  ];

  function bboxStr(b) { return `${b.s},${b.w},${b.n},${b.e}`; }

  // Everything in ONE request (one server queue wait instead of four):
  // roads incl. service lanes (minus parking aisles / private driveways),
  // water, parks, rivers, area names and the buildings of the urban core.
  const Q_ALL = `[out:json][timeout:90];(` +
    `way["highway"~"^(${HIGHWAY_REGEX})$"](${bboxStr(BBOX)});` +
    `way["highway"="service"]["service"!~"parking_aisle|driveway"](${bboxStr(BBOX)});` +
    `way["natural"="water"](${bboxStr(BBOX)});` +
    `relation["natural"="water"](${bboxStr(BBOX)});` +
    `way["leisure"~"^(park|garden|pitch|stadium)$"](${bboxStr(BBOX)});` +
    `way["landuse"~"^(forest|grass|recreation_ground|cemetery)$"](${bboxStr(BBOX)});` +
    `way["waterway"="river"](${bboxStr(BBOX)});` +
    `node["place"~"^(suburb|neighbourhood|quarter|town|village|hamlet)$"](${bboxStr(BBOX)});` +
    `node["highway"="traffic_signals"](${bboxStr(BBOX)});` +
    `way["building"](${bboxStr(BBOX_BUILDINGS)});` +
    `);out geom qt;`;

  /* --------------------------- IndexedDB cache --------------------------- */
  function idbOpen() {
    return new Promise((res, rej) => {
      const rq = indexedDB.open('duhok-drive', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('osm');
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  async function idbGet(key) {
    try {
      const db = await idbOpen();
      return await new Promise((res, rej) => {
        const rq = db.transaction('osm').objectStore('osm').get(key);
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    } catch (e) { return undefined; }
  }
  async function idbPut(key, val) {
    try {
      const db = await idbOpen();
      await new Promise((res, rej) => {
        const tx = db.transaction('osm', 'readwrite');
        tx.objectStore('osm').put(val, key);
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
    } catch (e) { /* cache is best-effort */ }
  }
  async function clearCache() {
    try {
      const db = await idbOpen();
      await new Promise((res, rej) => {
        const tx = db.transaction('osm', 'readwrite');
        tx.objectStore('osm').clear();
        tx.oncomplete = res; tx.onerror = () => rej(tx.error);
      });
    } catch (e) {}
  }

  /* ------------------------- Overpass API fetch -------------------------- */
  // The Overpass servers can be busy and queue requests for a long time, so
  // every fetch has a hard time budget and a stall detector, and the player
  // can abort the whole live load at any moment (skipLive → offline map).
  let liveAborted = false;
  const liveControllers = new Set();
  function skipLive() {
    liveAborted = true;
    for (const c of liveControllers) { try { c.abort(); } catch (e) {} }
  }

  async function fetchOverpass(query, label, onStatus, mirrors, maxMs) {
    let lastErr = null;
    const totalDeadline = Date.now() + maxMs;
    for (const url of mirrors) {
      if (liveAborted) throw new Error('skipped by user');
      if (Date.now() > totalDeadline) break;
      const ctl = new AbortController();
      liveControllers.add(ctl);
      const started = Date.now();
      let gotBytes = false;
      let lastProgress = started;
      // The server may legitimately compute for a long while before the first
      // byte (Overpass queues requests), so be patient up front — but once
      // data is flowing, a long silence means the connection is dead.
      const watchdog = setInterval(() => {
        const silence = Date.now() - lastProgress;
        if ((gotBytes && silence > 30000) ||
            (!gotBytes && silence > 60000) ||
            Date.now() > totalDeadline) ctl.abort();
      }, 1000);
      try {
        const host = new URL(url).host;
        onStatus(`${label} — asking ${host} (can take up to a minute)…`);
        const resp = await fetch(url, {
          method: 'POST',
          body: new URLSearchParams({ data: query }),
          signal: ctl.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status} from ${host}`);
        // Stream the body so we can show download progress (payloads are MBs).
        const reader = resp.body && resp.body.getReader ? resp.body.getReader() : null;
        let text;
        if (reader) {
          const chunks = []; let received = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value); received += value.length;
            gotBytes = true;
            lastProgress = Date.now();
            onStatus(`${label} — downloading ${(received / 1048576).toFixed(1)} MB…`);
          }
          const all = new Uint8Array(received);
          let off = 0; for (const c of chunks) { all.set(c, off); off += c.length; }
          text = new TextDecoder().decode(all);
        } else {
          text = await resp.text();
        }
        onStatus(`${label} — parsing…`);
        const json = JSON.parse(text);
        if (!json.elements) throw new Error('no elements in response');
        if (!json.elements.length && json.remark) throw new Error(json.remark);
        return json;
      } catch (e) {
        lastErr = e;
        console.warn('Overpass mirror failed:', url, e);
      } finally {
        clearInterval(watchdog);
        liveControllers.delete(ctl);
      }
    }
    throw lastErr || new Error('all Overpass mirrors failed');
  }

  /* ------------------------------ Parsers -------------------------------- */
  function projGeom(geometry) {
    const pts = [];
    for (const g of geometry) {
      const p = project(g.lat, g.lon);
      pts.push(p.x, p.z);
    }
    return pts;
  }

  function parseRoads(json) {
    const roads = [];
    for (const el of json.elements) {
      if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
      const tags = el.tags || {};
      const cls = ROAD_CLASSES[tags.highway];
      if (!cls) continue;
      const oneway = tags.oneway === 'yes' || tags.oneway === '1' ||
                     tags.junction === 'roundabout';
      roads.push({
        name: tags['name:en'] || tags.name || '',
        cls: tags.highway,
        oneway,
        pts: projGeom(el.geometry),
      });
    }
    return roads;
  }

  function closedPoly(pts) {
    // pts = flat [x,z,...]; drop duplicated closing point if present
    const n = pts.length;
    if (n >= 4 && pts[0] === pts[n - 2] && pts[1] === pts[n - 1]) return pts.slice(0, n - 2);
    return pts;
  }

  function parseAreas(json) {
    const waters = [], greens = [], rivers = [];
    const pushWay = (el) => {
      const tags = el.tags || {};
      if (!el.geometry || el.geometry.length < 3) return;
      const poly = closedPoly(projGeom(el.geometry));
      if (tags.natural === 'water') waters.push(poly);
      else if (tags.waterway === 'river') rivers.push(projGeom(el.geometry));
      else if (tags.leisure || tags.landuse) greens.push(poly);
    };
    for (const el of json.elements) {
      if (el.type === 'way') pushWay(el);
      else if (el.type === 'relation' && el.members && (el.tags || {}).natural === 'water') {
        // multipolygon lake: stitch outer member ways into rings
        const outers = el.members.filter(m => m.type === 'way' && m.role !== 'inner' && m.geometry);
        for (const ring of stitchRings(outers)) waters.push(ring);
      }
    }
    return { waters, greens, rivers };
  }

  function stitchRings(members) {
    // join way fragments that share endpoints into closed rings (best effort)
    const frags = members.map(m => m.geometry.map(g => { const p = project(g.lat, g.lon); return [p.x, p.z]; }));
    const rings = [];
    const eq = (a, b) => Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1;
    while (frags.length) {
      let ring = frags.pop();
      let grew = true;
      while (grew && !eq(ring[0], ring[ring.length - 1])) {
        grew = false;
        for (let i = 0; i < frags.length; i++) {
          const f = frags[i];
          if (eq(ring[ring.length - 1], f[0])) { ring = ring.concat(f.slice(1)); frags.splice(i, 1); grew = true; break; }
          if (eq(ring[ring.length - 1], f[f.length - 1])) { ring = ring.concat(f.slice(0, -1).reverse()); frags.splice(i, 1); grew = true; break; }
          if (eq(ring[0], f[f.length - 1])) { ring = f.slice(0, -1).concat(ring); frags.splice(i, 1); grew = true; break; }
          if (eq(ring[0], f[0])) { ring = f.slice(1).reverse().concat(ring); frags.splice(i, 1); grew = true; break; }
        }
      }
      if (ring.length >= 3) {
        const flat = [];
        for (const p of ring) flat.push(p[0], p[1]);
        rings.push(closedPoly(flat));
      }
    }
    return rings;
  }

  function parseBuildings(json) {
    const buildings = [];
    for (const el of json.elements) {
      if (el.type !== 'way' || !el.geometry || el.geometry.length < 4) continue;
      const tags = el.tags || {};
      let h = 0;
      if (tags.height) h = parseFloat(tags.height) || 0;
      else if (tags['building:levels']) h = (parseFloat(tags['building:levels']) || 0) * 3.2;
      if (!h) h = 4.5 + ((el.id % 7)) * 1.1;           // typical 1–3 storey Duhok houses
      if (h > 90) h = 90;
      const pts = closedPoly(projGeom(el.geometry));
      buildings.push({ pts, h, d2: pts[0] * pts[0] + pts[1] * pts[1] });
    }
    // keep the buildings nearest the city centre if there are very many
    const CAP = 28000;
    if (buildings.length > CAP) {
      buildings.sort((a, b) => a.d2 - b.d2);
      buildings.length = CAP;
    }
    for (const b of buildings) delete b.d2;
    return buildings;
  }

  function parsePlaces(json) {
    const places = [];
    for (const el of json.elements) {
      if (el.type !== 'node' || !el.tags || !el.tags.name) continue;
      const p = project(el.lat, el.lon);
      places.push({
        name: el.tags['name:en'] || el.tags.name,
        x: p.x, z: p.z, kind: el.tags.place,
      });
    }
    return places;
  }

  /* ------------------------------ Main load ------------------------------ */
  async function loadCity(opts) {
    const onStatus = opts.onStatus || (() => {});
    const mirrors = opts.overpassUrl ? [opts.overpassUrl] : MIRRORS;

    if (!opts.forceRefresh && !opts.forceOffline) {
      onStatus('Checking local map cache…');
      const cached = await idbGet(CACHE_KEY);
      if (cached && cached.roads && cached.roads.length) {
        onStatus('Loaded real Duhok map from cache.');
        cached.fromCache = true;
        return cached;
      }
    }

    if (opts.forceOffline) return FALLBACK_MAP.build();

    liveAborted = false;
    try {
      const json = await fetchOverpass(Q_ALL, 'Real map of Duhok', onStatus, mirrors, 150000);
      onStatus('Sorting roads, buildings & areas…');
      // split the combined response by tags
      const roadEls = [], areaEls = [], buildingEls = [], placeEls = [], signals = [];
      for (const el of json.elements) {
        const t = el.tags || {};
        if (t.highway === 'traffic_signals') {
          const p = project(el.lat, el.lon);
          signals.push({ x: p.x, z: p.z });
        }
        else if (t.highway) roadEls.push(el);
        else if (t.building) buildingEls.push(el);
        else if (t.place) placeEls.push(el);
        else areaEls.push(el);
      }
      const roads = parseRoads({ elements: roadEls });
      if (roads.length < 30) throw new Error('suspiciously little road data');
      const areas = parseAreas({ elements: areaEls });
      const buildings = parseBuildings({ elements: buildingEls });
      const places = parsePlaces({ elements: placeEls });

      const city = {
        source: 'osm',
        attribution: 'Map data © OpenStreetMap contributors (ODbL)',
        roads, buildings, places, signals,
        waters: areas.waters, greens: areas.greens, rivers: areas.rivers,
      };
      onStatus('Saving map to cache…');
      await idbPut(CACHE_KEY, city);
      return city;
    } catch (e) {
      console.warn('Live OSM load failed, using bundled offline map.', e);
      const city = FALLBACK_MAP.build();
      city.offlineReason = String(e && e.message || e);
      return city;
    }
  }

  return { ANCHOR, BBOX, LANDMARKS, ROAD_CLASSES, project, unproject, loadCity, clearCache, skipLive };
})();

/* ============================================================================
 * world.js — Builds the 3D world of Duhok: terrain (the valley between the
 * Bêxêr and Zawa ridges), roads at real scale, the dam lake, buildings and
 * the city's landmarks.  All coordinates are metres (1 unit = 1 m).
 * ==========================================================================*/
'use strict';

const WORLD = (() => {

  /* ------------------------------ utilities ----------------------------- */

  function makeSegmentHash(cell) {
    const map = new Map();
    const key = (cx, cz) => cx + ',' + cz;
    function addSeg(ax, az, bx, bz, data) {
      const minX = Math.min(ax, bx), maxX = Math.max(ax, bx);
      const minZ = Math.min(az, bz), maxZ = Math.max(az, bz);
      for (let cx = Math.floor(minX / cell); cx <= Math.floor(maxX / cell); cx++) {
        for (let cz = Math.floor(minZ / cell); cz <= Math.floor(maxZ / cell); cz++) {
          const k = key(cx, cz);
          let arr = map.get(k);
          if (!arr) { arr = []; map.set(k, arr); }
          arr.push({ ax, az, bx, bz, data });
        }
      }
    }
    function segDist2(px, pz, s) {
      const dx = s.bx - s.ax, dz = s.bz - s.az;
      const len2 = dx * dx + dz * dz || 1e-9;
      let t = ((px - s.ax) * dx + (pz - s.az) * dz) / len2;
      t = t < 0 ? 0 : (t > 1 ? 1 : t);
      const qx = s.ax + t * dx - px, qz = s.az + t * dz - pz;
      return qx * qx + qz * qz;
    }
    function nearest(px, pz, maxR) {
      const rC = Math.ceil(maxR / cell);
      const cx0 = Math.floor(px / cell), cz0 = Math.floor(pz / cell);
      let best = null, bestD2 = maxR * maxR;
      for (let r = 0; r <= rC; r++) {
        for (let cx = cx0 - r; cx <= cx0 + r; cx++) {
          for (let cz = cz0 - r; cz <= cz0 + r; cz++) {
            if (Math.max(Math.abs(cx - cx0), Math.abs(cz - cz0)) !== r) continue;
            const arr = map.get(key(cx, cz));
            if (!arr) continue;
            for (const s of arr) {
              const d2 = segDist2(px, pz, s);
              if (d2 < bestD2) { bestD2 = d2; best = s; }
            }
          }
        }
        // if we already found something closer than the next ring can offer, stop
        if (best && Math.sqrt(bestD2) < (r) * cell - cell * 0.5) break;
      }
      return best ? { d: Math.sqrt(bestD2), seg: best } : null;
    }
    return { addSeg, nearest, _map: map };
  }

  function makeBoxHash(cell) {
    const map = new Map();
    const boxes = [];
    function addBox(x0, z0, x1, z1) {
      const b = { x0, z0, x1, z1 };
      boxes.push(b);
      for (let cx = Math.floor(x0 / cell); cx <= Math.floor(x1 / cell); cx++) {
        for (let cz = Math.floor(z0 / cell); cz <= Math.floor(z1 / cell); cz++) {
          const k = cx + ',' + cz;
          let arr = map.get(k);
          if (!arr) { arr = []; map.set(k, arr); }
          arr.push(b);
        }
      }
    }
    function query(px, pz, r) {
      const out = [];
      for (let cx = Math.floor((px - r) / cell); cx <= Math.floor((px + r) / cell); cx++) {
        for (let cz = Math.floor((pz - r) / cell); cz <= Math.floor((pz + r) / cell); cz++) {
          const arr = map.get(cx + ',' + cz);
          if (arr) for (const b of arr) if (out.indexOf(b) === -1) out.push(b);
        }
      }
      return out;
    }
    return { addBox, query, boxes };
  }

  const _rng = (seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  })(20260704);

  /* ------------------------------- terrain ------------------------------ */
  // Raw geological height: valley floor at 0, White Mountain (Bêxêr) ridge to
  // the north, Zawa ridge to the south with the Gali Duhok gorge cut through,
  // and the raised bowl that holds the dam lake.
  function rawHeight(x, z) {
    const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
    let h = 0;
    // Bêxêr ridge (north — pale rock)
    const n = smooth((-z - 3200) / 2100);
    h += 360 * n * (0.82 + 0.18 * Math.sin(x * 0.00071 + 1.4) + 0.07 * Math.sin(x * 0.0023));
    // Zawa ridge (south) with the gorge cut at the Mosul road
    let s = smooth((z - 2300) / 2100);
    const gorge = Math.exp(-((x + 620) * (x + 620)) / (2 * 260 * 260));
    s *= (1 - 0.93 * gorge);
    h += 320 * s * (0.85 + 0.15 * Math.sin(x * 0.00082 + 0.4));
    // Dam lake bowl (raised ground holding the reservoir)
    const dx = (x - 1250) / 850, dz = (z + 2560) / 640;
    h += 26 * Math.exp(-(dx * dx + dz * dz) / 2);
    // gentle rolling of the valley floor far from centre
    h += 2.5 * Math.sin(x * 0.0012 + 2.0) * Math.sin(z * 0.0014);
    return h;
  }

  /* ------------------------------ materials ----------------------------- */
  // Procedural canvas textures give surfaces some grain: asphalt aggregate,
  // dusty ground, and window grids on building walls.  They are near-white
  // and multiply with the vertex colours that carry the actual hues.
  function canvasTex(size, painter, repeat) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    painter(cv.getContext('2d'), size);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    if (repeat) tex.repeat.set(repeat[0], repeat[1]);
    tex.anisotropy = 4;
    return tex;
  }
  function makeAsphaltTex() {
    return canvasTex(256, (ctx, s) => {
      ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 5200; i++) {
        const g = 190 + (Math.random() * 65) | 0;
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 1.6, 1.6);
      }
      for (let i = 0; i < 130; i++) {              // coarse aggregate
        const g = 150 + (Math.random() * 60) | 0;
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 3, 3);
      }
    });
  }
  function makeGroundTex() {
    return canvasTex(256, (ctx, s) => {
      ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 4200; i++) {
        const g = 205 + (Math.random() * 50) | 0;
        ctx.fillStyle = `rgba(${g},${g - 8},${g - 20},0.85)`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 2.2, 2.2);
      }
      for (let i = 0; i < 60; i++) {               // scrub patches
        ctx.fillStyle = 'rgba(150,160,120,0.25)';
        ctx.beginPath();
        ctx.arc(Math.random() * s, Math.random() * s, 3 + Math.random() * 7, 0, 7);
        ctx.fill();
      }
    });
  }
  function makeWindowsTex() {
    // 3×3 windows per tile with plain margins (roofs sample the corner)
    return canvasTex(128, (ctx, s) => {
      ctx.fillStyle = '#f4f2ee'; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 700; i++) {
        const g = 225 + (Math.random() * 30) | 0;
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
      for (let wx = 0; wx < 3; wx++) {
        for (let wy = 0; wy < 3; wy++) {
          const x = 14 + wx * 38, y = 12 + wy * 40;
          ctx.fillStyle = '#7d8ea0';
          ctx.fillRect(x, y, 22, 26);
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(x + 2, y + 2, 8, 10);
          ctx.strokeStyle = '#5c6672'; ctx.lineWidth = 2;
          ctx.strokeRect(x, y, 22, 26);
        }
      }
    });
  }

  const MAT = {};
  function initMaterials() {
    MAT.vcLambert = new THREE.MeshLambertMaterial({ vertexColors: true });
    MAT.vcBasic = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    MAT.terrain = new THREE.MeshLambertMaterial({ vertexColors: true, map: makeGroundTex() });
    MAT.road = new THREE.MeshBasicMaterial({ vertexColors: true, map: makeAsphaltTex(), side: THREE.DoubleSide });
    MAT.walls = new THREE.MeshBasicMaterial({ vertexColors: true, map: makeWindowsTex(), side: THREE.DoubleSide });
  }

  /* --------------------------- geometry helpers ------------------------- */
  // sRGB → linear working space (r185 expects vertex colours in linear space)
  const lin = c => [Math.pow(c[0], 2.2), Math.pow(c[1], 2.2), Math.pow(c[2], 2.2)];

  // Accumulator for merged, non-indexed, vertex-coloured triangles.
  function makeAcc() {
    return { pos: [], col: [], uv: [], nor: null };
  }
  function accToMesh(acc, material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(acc.col, 3));
    if (acc.uv.length * 3 === acc.pos.length * 2) {
      g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uv, 2));
    }
    if (material === MAT.vcLambert) g.computeVertexNormals();
    const m = new THREE.Mesh(g, material);
    m.matrixAutoUpdate = false;
    return m;
  }
  function pushTri(acc, ax, ay, az, bx, by, bz, cx, cy, cz, r, g, b) {
    acc.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    acc.col.push(r, g, b, r, g, b, r, g, b);
  }
  function pushQuad(acc, a, b, c, d, col, uvs) {
    pushTri(acc, a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], col[0], col[1], col[2]);
    pushTri(acc, a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2], col[0], col[1], col[2]);
    if (uvs) {
      acc.uv.push(uvs[0][0], uvs[0][1], uvs[1][0], uvs[1][1], uvs[2][0], uvs[2][1]);
      acc.uv.push(uvs[0][0], uvs[0][1], uvs[2][0], uvs[2][1], uvs[3][0], uvs[3][1]);
    }
  }

  // Ribbon along a flat [x,z,...] polyline at height y with width w.
  function pushRibbon(acc, pts, w, y, col) {
    const n = pts.length / 2;
    if (n < 2) return;
    const hw = w / 2;
    let prevL = null, prevR = null, prevV = 0, vDist = 0;
    for (let i = 0; i < n; i++) {
      const x = pts[i * 2], z = pts[i * 2 + 1];
      const x0 = i > 0 ? pts[(i - 1) * 2] : x, z0 = i > 0 ? pts[(i - 1) * 2 + 1] : z;
      const x1 = i < n - 1 ? pts[(i + 1) * 2] : x, z1 = i < n - 1 ? pts[(i + 1) * 2 + 1] : z;
      let dx = x1 - x0, dz = z1 - z0;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      if (i > 0) vDist += Math.hypot(x - x0, z - z0) / (w || 1);
      // perpendicular (left of travel direction)
      const px = -dz, pz = dx;
      const L = [x + px * hw, y, z + pz * hw];
      const R = [x - px * hw, y, z - pz * hw];
      if (prevL) {
        pushQuad(acc, prevL, prevR, R, L, col,
          [[0, prevV], [1, prevV], [1, vDist], [0, vDist]]);
      }
      prevL = L; prevR = R; prevV = vDist;
    }
  }

  // Dashed ribbon (for lane markings)
  function pushDashes(acc, pts, w, y, col, dashLen, gapLen) {
    const n = pts.length / 2;
    let carry = 0, drawing = true;
    for (let i = 0; i < n - 1; i++) {
      let ax = pts[i * 2], az = pts[i * 2 + 1];
      const bx = pts[(i + 1) * 2], bz = pts[(i + 1) * 2 + 1];
      let segLen = Math.hypot(bx - ax, bz - az);
      if (segLen < 1e-6) continue;
      const ux = (bx - ax) / segLen, uz = (bz - az) / segLen;
      while (segLen > 0) {
        const want = (drawing ? dashLen : gapLen) - carry;
        const step = Math.min(want, segLen);
        const nx = ax + ux * step, nz = az + uz * step;
        if (drawing) {
          const px = -uz * w / 2, pz = ux * w / 2;
          pushQuad(acc,
            [ax + px, y, az + pz], [ax - px, y, az - pz],
            [nx - px, y, nz - pz], [nx + px, y, nz + pz], col);
        }
        carry += step; segLen -= step;
        ax = nx; az = nz;
        if (carry >= (drawing ? dashLen : gapLen) - 1e-6) { carry = 0; drawing = !drawing; }
      }
    }
  }

  // Offset a flat polyline sideways (for dual-carriageway median lines etc.)
  function offsetLine(pts, off) {
    const n = pts.length / 2, out = new Array(pts.length);
    for (let i = 0; i < n; i++) {
      const x0 = i > 0 ? pts[(i - 1) * 2] : pts[i * 2];
      const z0 = i > 0 ? pts[(i - 1) * 2 + 1] : pts[i * 2 + 1];
      const x1 = i < n - 1 ? pts[(i + 1) * 2] : pts[i * 2];
      const z1 = i < n - 1 ? pts[(i + 1) * 2 + 1] : pts[i * 2 + 1];
      let dx = x1 - x0, dz = z1 - z0;
      const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      out[i * 2] = pts[i * 2] - dz * off;
      out[i * 2 + 1] = pts[i * 2 + 1] + dx * off;
    }
    return out;
  }

  function pushPolygon(acc, poly, y, col, uvConst) {
    const contour = [];
    for (let i = 0; i < poly.length; i += 2) contour.push(new THREE.Vector2(poly[i], poly[i + 1]));
    if (contour.length < 3) return;
    let tris;
    try { tris = THREE.ShapeUtils.triangulateShape(contour, []); }
    catch (e) { return; }
    for (const t of tris) {
      pushTri(acc,
        contour[t[0]].x, y, contour[t[0]].y,
        contour[t[1]].x, y, contour[t[1]].y,
        contour[t[2]].x, y, contour[t[2]].y,
        col[0], col[1], col[2]);
      if (uvConst) acc.uv.push(uvConst[0], uvConst[1], uvConst[0], uvConst[1], uvConst[0], uvConst[1]);
    }
  }

  function polyCentroid(poly) {
    let x = 0, z = 0; const n = poly.length / 2;
    for (let i = 0; i < n; i++) { x += poly[i * 2]; z += poly[i * 2 + 1]; }
    return { x: x / n, z: z / n };
  }
  function polyBounds(poly) {
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    for (let i = 0; i < poly.length; i += 2) {
      x0 = Math.min(x0, poly[i]); x1 = Math.max(x1, poly[i]);
      z0 = Math.min(z0, poly[i + 1]); z1 = Math.max(z1, poly[i + 1]);
    }
    return { x0, z0, x1, z1 };
  }
  function pointInPoly(px, pz, poly) {
    let inside = false; const n = poly.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = poly[i * 2], zi = poly[i * 2 + 1], xj = poly[j * 2], zj = poly[j * 2 + 1];
      if ((zi > pz) !== (zj > pz) && px < (xj - xi) * (pz - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }

  /* ------------------------------ build steps --------------------------- */

  function buildRoadIndex(roads) {
    const hash = makeSegmentHash(60);
    for (const r of roads) {
      const p = r.pts;
      for (let i = 0; i < p.length / 2 - 1; i++) {
        hash.addSeg(p[i * 2], p[i * 2 + 1], p[i * 2 + 2], p[i * 2 + 3], r);
      }
    }
    return hash;
  }

  function makeHeightField(roadIndex) {
    // Effective height: geological height flattened near roads so the whole
    // drivable network stays level (roads are rendered at y≈0).
    return function heightAt(x, z) {
      const raw = rawHeight(x, z);
      // NB: negative valley dips must be flattened near roads too, otherwise
      // the car sinks below the road surface
      if (raw > -0.05 && raw < 0.4) return raw;
      const near = roadIndex.nearest(x, z, 150);
      if (!near) return raw;
      const d = near.d;
      const t = (d - 28) / 110;
      const f = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
      return raw * f;
    };
  }

  function buildTerrain(scene, heightAt, waterInfos) {
    const W = 20000, H = 15000, SX = 170, SZ = 128;
    const geo = new THREE.PlaneGeometry(W, H, SX, SZ);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i) - 600;   // shift: more land south
      let h = heightAt(x, z);
      // carve the lake beds below their water surface
      for (const wi of waterInfos) {
        if (x < wi.bb.x0 - 60 || x > wi.bb.x1 + 60 || z < wi.bb.z0 - 60 || z > wi.bb.z1 + 60) continue;
        if (pointInPoly(x, z, wi.poly)) h = Math.min(h, wi.y - 4);
      }
      pos.setX(i, x); pos.setZ(i, z);
      pos.setY(i, h - 0.35);        // tucked slightly under the roads
      // colour by elevation: dry valley floor → olive foothills → pale rock
      if (h < 6) c.setHex(0x9b8f6a).offsetHSL(0, 0, _rng() * 0.03 - 0.015);
      else if (h < 60) c.setHex(0x8a8256);
      else if (h < 180) c.setHex(0x97846a);
      else c.setHex(0xcfc5b3);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    // scale the grain texture over the whole plane
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 260, uv.getY(i) * 195);
    const mesh = new THREE.Mesh(geo, MAT.terrain);
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
  }

  function buildRoads(scene, roads) {
    const asphalt = makeAcc(), lines = makeAcc();
    const clsColor = {
      motorway: lin([0.165, 0.17, 0.19]), trunk: lin([0.165, 0.17, 0.19]),
      primary: lin([0.185, 0.19, 0.21]), secondary: lin([0.20, 0.21, 0.23]),
      tertiary: lin([0.215, 0.225, 0.245]), default: lin([0.235, 0.245, 0.26]),
    };
    const white = lin([0.88, 0.88, 0.9]), yellow = lin([0.85, 0.7, 0.2]);
    let i = 0;
    for (const r of roads) {
      const cls = OSM.ROAD_CLASSES[r.cls] || OSM.ROAD_CLASSES.residential;
      const col = clsColor[r.cls] || clsColor.default;
      const y = 0.05 + (i % 8) * 0.013;
      pushRibbon(asphalt, r.pts, cls.w, y, col);
      if (cls.rank <= 2) {
        const my = 0.155 + (i % 8) * 0.002;
        if (cls.dual) {
          pushRibbon(lines, offsetLine(r.pts, 0.4), 0.18, my, yellow);
          pushRibbon(lines, offsetLine(r.pts, -0.4), 0.18, my, yellow);
          pushDashes(lines, offsetLine(r.pts, cls.w * 0.25), 0.15, my, white, 3.5, 8);
          pushDashes(lines, offsetLine(r.pts, -cls.w * 0.25), 0.15, my, white, 3.5, 8);
        } else {
          pushDashes(lines, r.pts, 0.16, my, white, 3.5, 8);
        }
        pushRibbon(lines, offsetLine(r.pts, cls.w / 2 - 0.35), 0.15, my, white);
        pushRibbon(lines, offsetLine(r.pts, -(cls.w / 2 - 0.35)), 0.15, my, white);
      }
      i++;
    }
    scene.add(accToMesh(asphalt, MAT.road));
    scene.add(accToMesh(lines, MAT.vcBasic));
  }

  function waterSurfaces(city, heightAt) {
    const infos = [];
    for (const w of city.waters || []) {
      const c = polyCentroid(w);
      infos.push({ poly: w, bb: polyBounds(w), y: Math.max(1.2, heightAt(c.x, c.z) + 1.2) });
    }
    return infos;
  }

  function buildWaterAndGreens(scene, city, waterInfos) {
    const acc = makeAcc(), gAcc = makeAcc();
    for (const wi of waterInfos) {
      // the dam lake reads as deep turquoise in real photos
      pushPolygon(acc, wi.poly, wi.y, lin([0.13, 0.47, 0.52]));
    }
    for (const rv of city.rivers || []) {
      pushRibbon(acc, rv, 8, 0.03, lin([0.2, 0.45, 0.62]));
    }
    for (const g of city.greens || []) {
      pushPolygon(gAcc, g, 0.028, lin([0.32, 0.45, 0.22]));
    }
    scene.add(accToMesh(acc, MAT.vcBasic));
    scene.add(accToMesh(gAcc, MAT.vcBasic));
  }

  const BUILDING_PALETTE = [
    [0.82, 0.76, 0.65], [0.86, 0.82, 0.72], [0.78, 0.72, 0.6],
    [0.88, 0.85, 0.78], [0.73, 0.68, 0.58], [0.84, 0.78, 0.62],
  ].map(lin);

  function buildRealBuildings(scene, buildings, colHash) {
    // sun-baked shading baked into vertex colours (basic material, no lights)
    const sunX = 0.55, sunZ = -0.35;
    let acc = makeAcc(), inChunk = 0;
    const flush = () => {
      if (acc.pos.length) scene.add(accToMesh(acc, MAT.walls));
      acc = makeAcc(); inChunk = 0;
    };
    for (const b of buildings) {
      const poly = b.pts;
      const n = poly.length / 2;
      if (n < 3) continue;
      const base = BUILDING_PALETTE[(Math.floor(poly[0] * 13.7) & 1048575) % BUILDING_PALETTE.length];
      const h = b.h;
      // walls (window texture repeats every ~10 m / 3 floors)
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ax = poly[i * 2], az = poly[i * 2 + 1];
        const bx = poly[j * 2], bz = poly[j * 2 + 1];
        let nx = az - bz, nz = bx - ax;
        const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        const lum = 0.62 + 0.34 * Math.max(0, nx * sunX + nz * sunZ);
        const col = [base[0] * lum, base[1] * lum, base[2] * lum];
        const wl = Math.hypot(bx - ax, bz - az);
        const u1 = Math.max(0.35, wl / 10), v1 = Math.max(0.4, h / 9.5);
        pushQuad(acc, [ax, 0, az], [bx, 0, bz], [bx, h, bz], [ax, h, az], col,
          [[0, 0], [u1, 0], [u1, v1], [0, v1]]);
      }
      // roof (samples the plain corner of the window tile)
      pushPolygon(acc, poly, h, [base[0] * 0.55, base[1] * 0.55, base[2] * 0.55], [0.02, 0.02]);
      // collision (AABB is a fair fit for typical houses)
      const bb = polyBounds(poly);
      if (bb.x1 - bb.x0 < 120 && bb.z1 - bb.z0 < 120) colHash.addBox(bb.x0, bb.z0, bb.x1, bb.z1);
      if (++inChunk >= 700) flush();
    }
    flush();
  }

  function buildProceduralBuildings(scene, roads, roadIndex, colHash, landGreens) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const count = 6500;
    const mesh = new THREE.InstancedMesh(geo,
      new THREE.MeshLambertMaterial({ color: 0xffffff, map: makeWindowsTex() }), count);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    let idx = 0;
    const centre = OSM.project(36.8585, 42.9930);      // bazaar = downtown
    for (const r of roads) {
      if (idx >= count) break;
      const cls = OSM.ROAD_CLASSES[r.cls] || OSM.ROAD_CLASSES.residential;
      if (cls.rank < 2) continue;                       // no houses on highways
      const pts = r.pts;
      for (let i = 0; i < pts.length / 2 - 1 && idx < count; i++) {
        const ax = pts[i * 2], az = pts[i * 2 + 1];
        const bx = pts[i * 2 + 2], bz = pts[i * 2 + 3];
        const segLen = Math.hypot(bx - ax, bz - az);
        const ux = (bx - ax) / (segLen || 1), uz = (bz - az) / (segLen || 1);
        for (let d = 10; d < segLen - 10; d += 15 + _rng() * 12) {
          for (const side of [-1, 1]) {
            if (_rng() < 0.25 || idx >= count) continue;
            const off = cls.w / 2 + 5 + _rng() * 5;
            const cx = ax + ux * d - uz * off * side;
            const cz = az + uz * d + ux * off * side;
            // keep clear of other roads and parks
            const near = roadIndex.nearest(cx, cz, 30);
            if (near && near.d < cls.w / 2 + 3.5) continue;
            let inPark = false;
            for (const g of landGreens) { if (pointInPoly(cx, cz, g)) { inPark = true; break; } }
            if (inPark) continue;
            const distC = Math.hypot(cx - centre.x, cz - centre.z);
            const w = 7 + _rng() * 6, dep = 7 + _rng() * 6;
            let h = 3.6 + _rng() * 3.4;
            if (distC < 900) h = 6 + _rng() * 9;         // taller downtown
            m4.makeRotationY(-Math.atan2(uz, ux));
            m4.setPosition(cx, 0, cz);
            m4.elements[0] *= w; m4.elements[2] *= w;
            m4.elements[8] *= dep; m4.elements[10] *= dep;
            m4.elements[5] = h;
            mesh.setMatrixAt(idx, m4);
            const p = BUILDING_PALETTE[idx % BUILDING_PALETTE.length];
            col.setRGB(p[0], p[1], p[2]);
            mesh.setColorAt(idx, col);
            colHash.addBox(cx - w / 2, cz - dep / 2, cx + w / 2, cz + dep / 2);
            idx++;
          }
        }
      }
    }
    mesh.count = idx;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    scene.add(mesh);
  }

  /* ------------------------------ landmarks ----------------------------- */

  function makeLabelSprite(text, sub) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 144;
    const ctx = cv.getContext('2d');
    ctx.textAlign = 'center';
    ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,12,18,0.85)';
    ctx.font = '700 52px system-ui, sans-serif';
    ctx.strokeText(text, 256, 62); ctx.fillStyle = '#ffffff'; ctx.fillText(text, 256, 62);
    if (sub) {
      ctx.font = '500 30px system-ui, sans-serif';
      ctx.lineWidth = 6;
      ctx.strokeText(sub, 256, 108); ctx.fillStyle = '#ffd75e'; ctx.fillText(sub, 256, 108);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(72, 20, 1);
    sp.renderOrder = 50;
    return sp;
  }

  function makePlaceLabel(text) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 96;
    const ctx = cv.getContext('2d');
    ctx.textAlign = 'center';
    ctx.font = '600 44px system-ui, sans-serif';
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(10,12,18,0.7)';
    ctx.strokeText(text, 256, 60);
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText(text, 256, 60);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true }));
    sp.scale.set(54, 10.1, 1);
    sp.renderOrder = 40;
    return sp;
  }

  // A real-text sign board (e.g. "MAZI MALL") as a thin box with the text
  // baked onto both large faces.
  function makeSign(text, bgColor, fgColor, w, h) {
    const cv = document.createElement('canvas');
    cv.width = 1024; cv.height = Math.max(64, Math.round(1024 * h / w));
    const ctx = cv.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = fgColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = Math.floor(cv.height * 0.62);
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    while (ctx.measureText(text).width > cv.width * 0.92 && size > 10) {
      size -= 4; ctx.font = `800 ${size}px system-ui, sans-serif`;
    }
    ctx.fillText(text, cv.width / 2, cv.height / 2 + size * 0.05);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    const faceMat = new THREE.MeshBasicMaterial({ map: tex });
    const sideMat = new THREE.MeshLambertMaterial({ color: bgColor });
    const geo = new THREE.BoxGeometry(w, h, 0.4);
    // box material order: +x,-x,+y,-y,+z,-z — text on the two big faces
    const mesh = new THREE.Mesh(geo, [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat]);
    return mesh;
  }

  // Kurdistan flag texture (red-white-green bands, yellow sun) — like the
  // giant flag displayed on the mountainside above Duhok.
  function makeKurdistanFlag(w, h) {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 320;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ee3a43'; ctx.fillRect(0, 0, 512, 107);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 107, 512, 107);
    ctx.fillStyle = '#2a9c48'; ctx.fillRect(0, 214, 512, 106);
    ctx.fillStyle = '#f8c300';
    const cx = 256, cy = 160, r1 = 62, r2 = 26;
    ctx.beginPath();
    for (let i = 0; i < 42; i++) {
      const a = i * Math.PI / 21, r = i % 2 === 0 ? r1 : r2;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
    const tex = new THREE.CanvasTexture(cv);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
    return mesh;
  }

  function lambert(color) { return new THREE.MeshLambertMaterial({ color }); }

  function box(g, w, h, d, color, x, y, z, ry) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color));
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    g.add(m);
    return m;
  }
  function cyl(g, rT, rB, h, color, x, y, z, segs) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, segs || 14), lambert(color));
    m.position.set(x, y, z);
    g.add(m);
    return m;
  }

  function buildLandmark(lm, colHash) {
    const g = new THREE.Group();
    const p = OSM.project(lm.lat, lm.lon);
    g.position.set(p.x, 0, p.z);
    const addCol = (w, d, x = 0, z = 0) =>
      colHash.addBox(p.x + x - w / 2, p.z + z - d / 2, p.x + x + w / 2, p.z + z + d / 2);
    let labelH = 40;

    switch (lm.kind) {
      case 'dam': {
        // 600 m long, 60 m high embankment dam across the valley mouth:
        // a box with the top edge pinched into a trapezoidal ridge
        const ridgeGeo = new THREE.BoxGeometry(620, 58, 90);
        {
          const pos = ridgeGeo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            if (pos.getY(i) > 0) pos.setZ(i, pos.getZ(i) * 0.12);
          }
          ridgeGeo.computeVertexNormals();
          ridgeGeo.translate(0, 29, 0);
        }
        const wall = new THREE.Mesh(ridgeGeo, lambert(0x9a938a));
        wall.position.set(0, 0, -140);
        g.add(wall);
        box(g, 624, 2.2, 9, 0x777d85, 0, 58.5, -140);   // crest road
        const dsign = makeSign('DUHOK DAM', '#26502f', '#ffffff', 60, 8);
        dsign.position.set(0, 34, -96);                  // on the city-side face
        g.add(dsign);
        cyl(g, 6, 6, 66, 0xb8b2a6, -80, 33, -190, 12);         // intake tower
        box(g, 40, 14, 30, 0x8a8478, 120, 7, -60);              // spillway house
        addCol(640, 90, 0, -140);
        labelH = 95;
        break;
      }
      case 'stadium': {
        // concrete outer bowl with Duhok SC's yellow-and-blue seating tiers
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(118, 136, 20, 28, 1, true), lambert(0xd8d4c8));
        bowl.material.side = THREE.DoubleSide;
        bowl.scale.z = 0.8;
        bowl.position.y = 10;
        g.add(bowl);
        const seatsB = new THREE.Mesh(
          new THREE.CylinderGeometry(105, 116, 7, 28, 1, true), lambert(0x2857a4));
        seatsB.material.side = THREE.DoubleSide;
        seatsB.scale.z = 0.8; seatsB.position.y = 14.5;
        g.add(seatsB);
        const seatsY = new THREE.Mesh(
          new THREE.CylinderGeometry(96, 106, 7, 28, 1, true), lambert(0xe8b820));
        seatsY.material.side = THREE.DoubleSide;
        seatsY.scale.z = 0.8; seatsY.position.y = 8;
        g.add(seatsY);
        const pitch = new THREE.Mesh(new THREE.CircleGeometry(95, 24), lambert(0x3f7a2e));
        pitch.rotation.x = -Math.PI / 2; pitch.scale.y = 0.72;
        pitch.position.y = 0.35;
        g.add(pitch);
        // white roof canopy over the main (west) stand
        for (let i = -3; i <= 3; i++) {
          const seg = box(g, 24, 1.2, 34, 0xf2f1ea, -128 + Math.abs(i) * 2.5, 24 - Math.abs(i) * 0.8, i * 26 * 0.8, 0);
          seg.rotation.z = 0.18;
        }
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + i * Math.PI / 2;
          cyl(g, 1.2, 1.6, 42, 0xcccccc, Math.cos(a) * 140, 21, Math.sin(a) * 112 * 0.9, 8);
          box(g, 8, 5, 1.2, 0xf3f0dd, Math.cos(a) * 140, 44, Math.sin(a) * 112 * 0.9, -a);
        }
        const ssign = makeSign('DUHOK STADIUM', '#1c3f7a', '#ffffff', 44, 5.5);
        ssign.position.set(0, 23, 118);                  // over the entrance
        g.add(ssign);
        // ring collision approximated with four boxes
        addCol(270, 40, 0, -100); addCol(270, 40, 0, 100);
        addCol(40, 200, -125, 0); addCol(40, 200, 125, 0);
        labelH = 60;
        break;
      }
      case 'university': {
        const campus = [[-70, -20, 0], [10, 10, 0.3], [70, -15, -0.2]];
        for (const [x, z, ry] of campus) {
          box(g, 64, 15, 16, 0xe4ddcc, x, 7.5, z, ry);
          box(g, 64, 2.5, 17, 0x8a5b38, x, 16.2, z, ry);        // brown roof band
          addCol(66, 20, x, z);
        }
        // clock tower
        box(g, 7, 26, 7, 0xe4ddcc, -30, 13, 30);
        box(g, 8, 2, 8, 0x8a5b38, -30, 27, 30);
        const clock = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), lambert(0xf8f6ee));
        clock.position.set(-30, 22, 33.6); g.add(clock);
        addCol(9, 9, -30, 30);
        // main gate with name board
        box(g, 3.4, 13, 3.4, 0xcbbfa5, -16, 6.5, 60);
        box(g, 3.4, 13, 3.4, 0xcbbfa5, 16, 6.5, 60);
        box(g, 38, 3.4, 4, 0xb99d6b, 0, 14.7, 60);
        const usign = makeSign('UNIVERSITY OF DUHOK', '#274d36', '#f3e8c8', 34, 2.8);
        usign.position.set(0, 14.7, 62.3); g.add(usign);
        cyl(g, 0.3, 0.3, 22, 0xdddddd, 0, 11, 40, 6);
        addCol(4, 4, -16, 60); addCol(4, 4, 16, 60);
        labelH = 55;
        break;
      }
      case 'park': {
        // Azadi Park — ferris wheel + entrance
        const wheel = new THREE.Group();          // oriented mount
        const spin = new THREE.Group();           // the part that rotates
        const ring = new THREE.Mesh(new THREE.TorusGeometry(24, 0.9, 8, 28), lambert(0xd94f3d));
        spin.add(ring);
        for (let i = 0; i < 10; i++) {
          const a = i / 10 * Math.PI * 2;
          const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 47), lambert(0xe8e2d4));
          spoke.rotation.z = a;
          spin.add(spoke);
          const cab = new THREE.Mesh(new THREE.BoxGeometry(3, 3.4, 3),
            lambert([0xf2c14e, 0x4ea5d9, 0x7fb069, 0xd94f3d][i % 4]));
          cab.position.set(Math.cos(a) * 24, Math.sin(a) * 24 - 1.5, 1.2);
          spin.add(cab);
        }
        wheel.add(spin);
        wheel.rotation.y = Math.PI / 2;
        wheel.position.y = 27;
        g.add(wheel);
        g.userData.wheel = spin;
        for (const s of [-1, 1]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 30), lambert(0xb9b3a2));
          leg.position.set(s * 3, 14, s * 8);
          leg.rotation.x = s * 0.28;
          g.add(leg);
        }
        addCol(14, 20);
        // pond + entrance sign
        const pond = new THREE.Mesh(new THREE.CircleGeometry(26, 20), lambert(0x2e6f9e));
        pond.rotation.x = -Math.PI / 2;
        pond.position.set(55, 0.35, 45);
        g.add(pond);
        const psign = makeSign('AZADI PARK', '#1f6a43', '#ffffff', 24, 3.4);
        psign.position.set(0, 5.5, 90); g.add(psign);
        box(g, 26, 1.2, 2.2, 0xc9553e, 0, 7.6, 90);
        labelH = 62;
        break;
      }
      case 'bazaar': {
        // dense covered market + the Grand Mosque (white stone, big dome,
        // twin minarets with balconies)
        for (let i = 0; i < 8; i++) {
          const x = -55 + (i % 4) * 32, z = -14 + Math.floor(i / 4) * 30;
          box(g, 26, 6.5, 22, 0xcfc3a8, x, 3.25, z);
          box(g, 27, 1.6, 23, 0x9c6b3f, x, 7.2, z);
          addCol(27, 23, x, z);
        }
        const bsign = makeSign('GRAND BAZAAR', '#7a4a1e', '#ffe9b0', 30, 3.6);
        bsign.position.set(-23, 10, 4);
        bsign.rotation.y = Math.PI / 2;
        g.add(bsign);
        box(g, 44, 12, 34, 0xf3ede0, 62, 6, 4);                 // prayer hall
        box(g, 46, 1.2, 36, 0xe3dbc8, 62, 12.4, 4);
        const drum = cyl(g, 11, 12, 4, 0xf3ede0, 62, 14, 4, 18);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(11, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0x4d8a68));
        dome.position.set(62, 16, 4); g.add(dome);
        for (const mz of [-16, 24]) {                            // twin minarets
          cyl(g, 1.5, 1.9, 40, 0xf6f1e4, 40, 20, mz, 10);
          cyl(g, 2.3, 2.3, 1.4, 0xe3dbc8, 40, 27, mz, 10);       // balcony
          cyl(g, 2.3, 2.3, 1.4, 0xe3dbc8, 40, 35, mz, 10);
          const cap = new THREE.Mesh(new THREE.ConeGeometry(2.1, 5.5, 10), lambert(0x4d8a68));
          cap.position.set(40, 42.5, mz); g.add(cap);
        }
        addCol(46, 36, 62, 4);
        labelH = 56;
        break;
      }
      case 'mall': {
        // per-mall styling: Mazi = blue glass + red sign; others beige
        const isMazi = lm.id === 'mazi';
        const bodyColor = isMazi ? 0x6fa8cf : 0xd7cfc2;
        const body = box(g, 130, 17, 62, bodyColor, 0, 8.5, 0);
        if (isMazi) body.material = new THREE.MeshPhongMaterial({ color: 0x5f9cc8, shininess: 90, specular: 0xbfd8ea });
        box(g, 130, 3.2, 62, 0x8f8a80, 0, 18.6, 0);
        box(g, 100, 10, 2, isMazi ? 0x9cc4e0 : 0x77b7d9, 0, 6, 32);   // glass front
        const signText = lm.id === 'mazi' ? 'MAZI MALL' : lm.id === 'family' ? 'FAMILY MALL' : 'DUHOK MALL';
        const sign = makeSign(signText, isMazi ? '#c8102e' : '#b03a2e', '#ffffff', 52, 8);
        sign.position.set(0, 24.5, 4); g.add(sign);
        const sign2 = makeSign(signText, isMazi ? '#c8102e' : '#b03a2e', '#ffffff', 30, 5);
        sign2.position.set(0, 12, 33.5); g.add(sign2);
        addCol(132, 64);
        labelH = 42;
        break;
      }
      case 'dream': {
        // gated villa community: cream villas, terracotta roofs, grand arch
        for (let rx = 0; rx < 5; rx++) {
          for (let rz = 0; rz < 3; rz++) {
            const x = -90 + rx * 45, z = -50 + rz * 48;
            box(g, 14, 7.5, 12, 0xead9c0, x, 3.75, z);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(10.6, 4.4, 4), lambert(0xa8542f));
            roof.rotation.y = Math.PI / 4;
            roof.position.set(x, 9.6, z);
            g.add(roof);
            addCol(15, 13, x, z);
          }
        }
        box(g, 5, 16, 5, 0xd8cbb4, -21, 8, 92);
        box(g, 5, 16, 5, 0xd8cbb4, 21, 8, 92);
        box(g, 50, 5, 6, 0xc9a86a, 0, 18.5, 92);
        const dsign = makeSign('DREAM CITY', '#20456e', '#ffe9b0', 40, 4.2);
        dsign.position.set(0, 18.5, 95.3); g.add(dsign);
        addCol(6, 6, -21, 92); addCol(6, 6, 21, 92);
        labelH = 48;
        break;
      }
      case 'gorge': {
        // viewpoint sign only — the gorge itself is carved into the terrain
        cyl(g, 0.25, 0.25, 5, 0x888888, 0, 2.5, 0, 6);
        box(g, 10, 3, 0.5, 0x2d6a4f, 0, 5.5, 0);
        labelH = 26;
        break;
      }
    }

    const label = makeLabelSprite(lm.name, lm.verified ? '' : '(approximate location)');
    label.position.y = labelH;
    g.add(label);
    g.userData.landmark = lm;
    g.userData.label = label;
    return g;
  }

  function buildTrees(scene, city, heightAt, roadIndex) {
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.4, 2.6, 6);
    trunkGeo.translate(0, 1.3, 0);
    const crownGeo = new THREE.SphereGeometry(2.2, 8, 6);
    crownGeo.translate(0, 4.4, 0);
    crownGeo.scale(1, 1.25, 1);
    const trunks = new THREE.InstancedMesh(trunkGeo, lambert(0x6b4a2f), 2200);
    const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), 2200);
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    let i = 0;
    const put = (x, z, s) => {
      if (i >= 2200) return;
      const y = heightAt(x, z);
      m4.makeScale(s, s * (0.85 + _rng() * 0.4), s);
      m4.setPosition(x, y, z);
      trunks.setMatrixAt(i, m4);
      crowns.setMatrixAt(i, m4);
      col.setHSL(0.26 + _rng() * 0.06, 0.45, 0.28 + _rng() * 0.1);
      crowns.setColorAt(i, col);
      i++;
    };
    // trees in parks/greens
    for (const gPoly of city.greens || []) {
      const bb = polyBounds(gPoly);
      const area = (bb.x1 - bb.x0) * (bb.z1 - bb.z0);
      const want = Math.min(140, Math.max(8, area / 6000));
      for (let k = 0; k < want; k++) {
        const x = bb.x0 + _rng() * (bb.x1 - bb.x0);
        const z = bb.z0 + _rng() * (bb.z1 - bb.z0);
        if (pointInPoly(x, z, gPoly)) put(x, z, 0.8 + _rng() * 0.9);
      }
    }
    // scattered valley trees
    for (let k = 0; k < 1400 && i < 2200; k++) {
      const x = -8500 + _rng() * 17000, z = -4500 + _rng() * 9000;
      const h = rawHeight(x, z);
      if (h > 40) continue;
      const near = roadIndex.nearest(x, z, 60);
      if (near && near.d < 14) continue;
      put(x, z, 0.7 + _rng() * 1.1);
    }
    trunks.count = crowns.count = i;
    trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    scene.add(trunks); scene.add(crowns);
  }

  /* --------------------------- traffic signals -------------------------- */
  // One signal head per mapped traffic_signals node, cycling on a shared
  // clock: north-south and east-west axes alternate green.
  const SIG_PERIOD = 26;
  function signalStateFor(clock, axis) {
    const t = clock % SIG_PERIOD;
    const local = axis === 'ns' ? t : (t + SIG_PERIOD / 2) % SIG_PERIOD;
    if (local < 10) return 'green';
    if (local < 12) return 'amber';
    return 'red';
  }

  function buildTrafficSignals(scene, city, roadIndex) {
    const mats = {
      redOn: new THREE.MeshBasicMaterial({ color: 0xff2a1e }),
      redOff: new THREE.MeshBasicMaterial({ color: 0x3c0e0a }),
      amberOn: new THREE.MeshBasicMaterial({ color: 0xffb020 }),
      amberOff: new THREE.MeshBasicMaterial({ color: 0x40300c }),
      greenOn: new THREE.MeshBasicMaterial({ color: 0x2aff5a }),
      greenOff: new THREE.MeshBasicMaterial({ color: 0x0c3a18 }),
    };
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x3a3d42 });
    const headMat = new THREE.MeshLambertMaterial({ color: 0x1e2126 });
    const lightGeo = new THREE.SphereGeometry(0.13, 8, 6);
    const items = [];
    const group = new THREE.Group();
    for (const sig of city.signals || []) {
      const near = roadIndex.nearest(sig.x, sig.z, 40);
      if (!near) continue;
      const s = near.seg;
      let ux = s.bx - s.ax, uz = s.bz - s.az;
      const l = Math.hypot(ux, uz) || 1; ux /= l; uz /= l;
      const cls = OSM.ROAD_CLASSES[s.data.cls] || OSM.ROAD_CLASSES.residential;
      const axis = Math.abs(ux) > Math.abs(uz) ? 'ew' : 'ns';
      const g = new THREE.Group();
      // pole at the right-hand kerb, head facing oncoming traffic
      g.position.set(sig.x - uz * (cls.w / 2 + 1.0), 0, sig.z + ux * (cls.w / 2 + 1.0));
      g.rotation.y = Math.atan2(ux, uz) + Math.PI;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 4.6, 8), poleMat);
      pole.position.y = 2.3;
      g.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.15, 0.3), headMat);
      head.position.set(0, 4.6, 0);
      g.add(head);
      const lights = {};
      for (const [name, dy] of [['red', 0.36], ['amber', 0], ['green', -0.36]]) {
        const m = new THREE.Mesh(lightGeo, mats[name + 'Off']);
        m.position.set(0, 4.6 + dy, 0.14);
        g.add(m);
        lights[name] = m;
      }
      group.add(g);
      items.push({ x: sig.x, z: sig.z, axis, lights, state: '' });
    }
    scene.add(group);

    let clock = 5;   // start mid-green
    return {
      items,
      stateFor(axis) { return signalStateFor(clock, axis); },
      update(dt) {
        clock += dt;
        for (const it of items) {
          const st = signalStateFor(clock, it.axis);
          if (st === it.state) continue;
          it.state = st;
          it.lights.red.material = st === 'red' ? mats.redOn : mats.redOff;
          it.lights.amber.material = st === 'amber' ? mats.amberOn : mats.amberOff;
          it.lights.green.material = st === 'green' ? mats.greenOn : mats.greenOff;
        }
      },
    };
  }

  /* ------------------------------ main entry ---------------------------- */

  function buildWorld(scene, city) {
    initMaterials();
    const roadIndex = buildRoadIndex(city.roads);
    const heightAt = makeHeightField(roadIndex);
    const colHash = makeBoxHash(80);

    const waterInfos = waterSurfaces(city, heightAt);
    buildTerrain(scene, heightAt, waterInfos);
    buildRoads(scene, city.roads);
    buildWaterAndGreens(scene, city, waterInfos);

    if (city.buildings && city.buildings.length > 400) {
      buildRealBuildings(scene, city.buildings, colHash);
    } else {
      buildProceduralBuildings(scene, city.roads, roadIndex, colHash, city.greens || []);
    }

    const landmarkGroups = [];
    for (const lm of OSM.LANDMARKS) {
      const grp = buildLandmark(lm, colHash);
      landmarkGroups.push(grp);
      scene.add(grp);
    }

    // real neighbourhood / area name labels floating over their centres
    const placeSprites = [];
    for (const pl of city.places || []) {
      const sp = makePlaceLabel(pl.name);
      sp.position.set(pl.x, heightAt(pl.x, pl.z) + 34, pl.z);
      placeSprites.push(sp);
      scene.add(sp);
    }

    // the giant Kurdistan flag on the White Mountain slope above the city
    {
      const fx = -400, fz = -4150;
      const flag = makeKurdistanFlag(260, 160);
      flag.position.set(fx, rawHeight(fx, fz) + 20, fz);
      flag.rotation.x = -0.42;         // leant back against the slope
      scene.add(flag);
    }

    buildTrees(scene, city, heightAt, roadIndex);
    const signalCtl = buildTrafficSignals(scene, city, roadIndex);

    return {
      heightAt,
      roadIndex,
      collisions: colHash,
      landmarks: landmarkGroups,
      signals: signalCtl,
      nearestRoad(x, z, maxR) {
        const hit = roadIndex.nearest(x, z, maxR || 130);
        if (!hit) return null;
        const r = hit.seg.data;
        const cls = OSM.ROAD_CLASSES[r.cls] || OSM.ROAD_CLASSES.residential;
        return { d: hit.d, road: r, halfW: cls.w / 2, name: r.name };
      },
      places: city.places || [],
      update(dt, px, pz) {
        signalCtl.update(dt);
        for (const grp of landmarkGroups) {
          if (grp.userData.wheel) grp.userData.wheel.rotation.z += dt * 0.15;
          const label = grp.userData.label;
          if (label && px !== undefined) {
            // labels fade out when you arrive at the landmark, and in the far distance
            const d = Math.hypot(grp.position.x - px, grp.position.z - pz);
            const near = Math.min(1, Math.max(0, (d - 200) / 140));
            const far = Math.min(1, Math.max(0, (3800 - d) / 800));
            const op = near * far;
            label.material.opacity = op;
            label.visible = op > 0.02;
          }
        }
        if (px !== undefined) {
          for (const sp of placeSprites) {
            const d = Math.hypot(sp.position.x - px, sp.position.z - pz);
            const near = Math.min(1, Math.max(0, (d - 130) / 90));
            const far = Math.min(1, Math.max(0, (2600 - d) / 600));
            const op = near * far * 0.95;
            sp.material.opacity = op;
            sp.visible = op > 0.02;
          }
        }
      },
    };
  }

  return { buildWorld, rawHeight };
})();

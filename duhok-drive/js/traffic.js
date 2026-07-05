/* ============================================================================
 * traffic.js — Road graph + AI traffic.
 *
 * Builds a drivable graph from the road polylines (OSM ways share node
 * coordinates at junctions, which become graph nodes) and runs a fleet of
 * AI cars that follow lanes with right-hand traffic, brake for each other
 * and for the player, and turn at junctions.
 * ==========================================================================*/
'use strict';

const TRAFFIC = (() => {

  const Q = 4;  // node quantisation: 1/4 metre
  const nodeKey = (x, z) => Math.round(x * Q) + ',' + Math.round(z * Q);

  /* -------------------- topology repair (pre-world build) ---------------- */
  // Mutates city.roads in place: inserts intersection points (procedural maps
  // only — OSM data is already topologically correct) and snaps dangling road
  // endpoints onto nearby segments so the graph is well connected.
  function prepare(city) {
    const roads = city.roads;

    if (city.procedural) splitAtCrossings(roads);
    snapEndpoints(roads);
    return buildNodes(roads);
  }

  function segIntersect(ax, az, bx, bz, cx, cz, dx, dz) {
    const rX = bx - ax, rZ = bz - az, sX = dx - cx, sZ = dz - cz;
    const denom = rX * sZ - rZ * sX;
    if (Math.abs(denom) < 1e-9) return null;
    const t = ((cx - ax) * sZ - (cz - az) * sX) / denom;
    const u = ((cx - ax) * rZ - (cz - az) * rX) / denom;
    if (t < 0.001 || t > 0.999 || u < 0.001 || u > 0.999) return null;
    return { t, u, x: ax + t * rX, z: az + t * rZ };
  }

  function splitAtCrossings(roads) {
    // spatial hash of segments
    const cell = 90, map = new Map();
    const segs = [];
    roads.forEach((r, ri) => {
      for (let i = 0; i < r.pts.length / 2 - 1; i++) {
        const s = { ri, i,
          ax: r.pts[i * 2], az: r.pts[i * 2 + 1],
          bx: r.pts[i * 2 + 2], bz: r.pts[i * 2 + 3] };
        segs.push(s);
        const x0 = Math.min(s.ax, s.bx), x1 = Math.max(s.ax, s.bx);
        const z0 = Math.min(s.az, s.bz), z1 = Math.max(s.az, s.bz);
        for (let cx = Math.floor(x0 / cell); cx <= Math.floor(x1 / cell); cx++)
          for (let cz = Math.floor(z0 / cell); cz <= Math.floor(z1 / cell); cz++) {
            const k = cx + ',' + cz;
            (map.get(k) || map.set(k, []).get(k)).push(s);
          }
      }
    });
    const inserts = new Map();   // 'ri:i' -> [{t,x,z}]
    const seen = new Set();
    for (const bucket of map.values()) {
      for (let a = 0; a < bucket.length; a++) {
        for (let b = a + 1; b < bucket.length; b++) {
          const s1 = bucket[a], s2 = bucket[b];
          if (s1.ri === s2.ri) continue;
          const pairKey = s1.ri + ':' + s1.i + '|' + s2.ri + ':' + s2.i;
          if (seen.has(pairKey)) continue;
          seen.add(pairKey);
          const hit = segIntersect(s1.ax, s1.az, s1.bx, s1.bz, s2.ax, s2.az, s2.bx, s2.bz);
          if (!hit) continue;
          const k1 = s1.ri + ':' + s1.i, k2 = s2.ri + ':' + s2.i;
          (inserts.get(k1) || inserts.set(k1, []).get(k1)).push({ t: hit.t, x: hit.x, z: hit.z });
          (inserts.get(k2) || inserts.set(k2, []).get(k2)).push({ t: hit.u, x: hit.x, z: hit.z });
        }
      }
    }
    applyInserts(roads, inserts);
  }

  function applyInserts(roads, inserts) {
    roads.forEach((r, ri) => {
      let changed = false;
      const out = [];
      const n = r.pts.length / 2;
      for (let i = 0; i < n - 1; i++) {
        out.push(r.pts[i * 2], r.pts[i * 2 + 1]);
        const ins = inserts.get(ri + ':' + i);
        if (ins) {
          ins.sort((p, q) => p.t - q.t);
          let px = r.pts[i * 2], pz = r.pts[i * 2 + 1];
          for (const p of ins) {
            if (Math.hypot(p.x - px, p.z - pz) < 0.5) continue;
            out.push(p.x, p.z);
            px = p.x; pz = p.z;
            changed = true;
          }
        }
      }
      out.push(r.pts[(n - 1) * 2], r.pts[(n - 1) * 2 + 1]);
      if (changed) r.pts = out;
    });
  }

  function snapEndpoints(roads) {
    // hash all segments
    const cell = 40, map = new Map();
    roads.forEach((r, ri) => {
      for (let i = 0; i < r.pts.length / 2 - 1; i++) {
        const ax = r.pts[i * 2], az = r.pts[i * 2 + 1];
        const bx = r.pts[i * 2 + 2], bz = r.pts[i * 2 + 3];
        const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx);
        const z0 = Math.min(az, bz), z1 = Math.max(az, bz);
        for (let cx = Math.floor(x0 / cell); cx <= Math.floor(x1 / cell); cx++)
          for (let cz = Math.floor(z0 / cell); cz <= Math.floor(z1 / cell); cz++) {
            const k = cx + ',' + cz;
            (map.get(k) || map.set(k, []).get(k)).push({ ri, i, ax, az, bx, bz });
          }
      }
    });
    const inserts = new Map();
    const SNAP = 9;
    roads.forEach((r, ri) => {
      const n = r.pts.length / 2;
      for (const pi of [0, n - 1]) {
        const px = r.pts[pi * 2], pz = r.pts[pi * 2 + 1];
        // is this endpoint already shared with another road point? cheap test via later node pass — just snap if hanging
        let best = null, bestD2 = SNAP * SNAP;
        const cx0 = Math.floor(px / cell), cz0 = Math.floor(pz / cell);
        for (let cx = cx0 - 1; cx <= cx0 + 1; cx++) for (let cz = cz0 - 1; cz <= cz0 + 1; cz++) {
          const arr = map.get(cx + ',' + cz);
          if (!arr) continue;
          for (const s of arr) {
            if (s.ri === ri) continue;
            const dx = s.bx - s.ax, dz = s.bz - s.az;
            const len2 = dx * dx + dz * dz || 1e-9;
            let t = ((px - s.ax) * dx + (pz - s.az) * dz) / len2;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            const qx = s.ax + t * dx, qz = s.az + t * dz;
            const d2 = (qx - px) * (qx - px) + (qz - pz) * (qz - pz);
            if (d2 < bestD2) { bestD2 = d2; best = { s, t, qx, qz }; }
          }
        }
        if (!best || bestD2 < 0.01) continue;   // nothing near, or already exact
        // snap the endpoint onto the segment (or its nearer vertex)
        let qx = best.qx, qz = best.qz;
        if (best.t < 0.08) { qx = best.s.ax; qz = best.s.az; }
        else if (best.t > 0.92) { qx = best.s.bx; qz = best.s.bz; }
        else {
          const k = best.s.ri + ':' + best.s.i;
          (inserts.get(k) || inserts.set(k, []).get(k)).push({ t: best.t, x: qx, z: qz });
        }
        r.pts[pi * 2] = qx; r.pts[pi * 2 + 1] = qz;
      }
    });
    applyInserts(roads, inserts);
  }

  function buildNodes(roads) {
    const nodes = new Map();
    roads.forEach((r, ri) => {
      const n = r.pts.length / 2;
      for (let i = 0; i < n; i++) {
        const k = nodeKey(r.pts[i * 2], r.pts[i * 2 + 1]);
        let node = nodes.get(k);
        if (!node) { node = []; nodes.set(k, node); }
        node.push({ ri, i });
      }
    });
    return nodes;
  }

  /* ------------------------------ AI fleet ------------------------------ */

  function create(scene, city, nodes, opts) {
    const roads = city.roads;
    const N_CARS = (opts && opts.count) || 46;
    const signals = (opts && opts.signals) || null;
    const rand = () => Math.random();

    // spawn weights: busier main roads
    const clsWeight = { 0: 6, 1: 5, 2: 3.5, 3: 2.2, 4: 1.0, 5: 0.6 };
    const weights = [];
    let totalW = 0;
    for (const r of roads) {
      const cls = OSM.ROAD_CLASSES[r.cls] || OSM.ROAD_CLASSES.residential;
      let len = 0;
      for (let i = 0; i < r.pts.length / 2 - 1; i++) {
        len += Math.hypot(r.pts[i * 2 + 2] - r.pts[i * 2], r.pts[i * 2 + 3] - r.pts[i * 2 + 1]);
      }
      totalW += (clsWeight[cls.rank] || 1) * Math.min(len, 3000);
      weights.push(totalW);
    }
    function randomRoad() {
      const t = rand() * totalW;
      let lo = 0, hi = weights.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (weights[mid] < t) lo = mid + 1; else hi = mid; }
      return lo;
    }

    const cars = [];
    for (let i = 0; i < N_CARS; i++) {
      const mesh = VEHICLES.makeTrafficCar(i);
      mesh.visible = false;
      scene.add(mesh);
      cars.push({
        mesh, active: false,
        ri: 0, i: 0, t: 0, dir: 1,
        speed: 0, driver: 0.75 + rand() * 0.3,
        stun: 0, heading: 0,
        halfLen: (mesh.userData.L || 4.6) / 2,
      });
    }

    function segOf(car) {
      const r = roads[car.ri], p = r.pts;
      const i = car.i;
      return [p[i * 2], p[i * 2 + 1], p[i * 2 + 2], p[i * 2 + 3]];
    }

    function laneOffsetOf(car) {
      const r = roads[car.ri];
      const cls = OSM.ROAD_CLASSES[r.cls] || OSM.ROAD_CLASSES.residential;
      if (r.oneway) return (cls.w * 0.22) * (car.laneSide || 0);
      return cls.dual ? cls.w * 0.27 : cls.w * 0.23;
    }

    function speedLimitOf(car) {
      const r = roads[car.ri];
      const cls = OSM.ROAD_CLASSES[r.cls] || OSM.ROAD_CLASSES.residential;
      return cls.kph / 3.6 * car.driver;
    }

    function placeCar(car) {
      const [ax, az, bx, bz] = segOf(car);
      let ux = bx - ax, uz = bz - az;
      const len = Math.hypot(ux, uz) || 1;
      ux /= len; uz /= len;
      if (car.dir < 0) { ux = -ux; uz = -uz; }
      const t = car.dir > 0 ? car.t : 1 - car.t;      // car.t counts along travel dir
      const cx = ax + (bx - ax) * t, cz = az + (bz - az) * t;
      const off = laneOffsetOf(car);
      // right-hand side of travel direction
      const px = -uz * off, pz = ux * off;
      car.x = cx + px; car.z = cz + pz;
      car.ux = ux; car.uz = uz;
      const h = Math.atan2(ux, uz);
      car.heading = h;
      car.mesh.position.set(car.x, 0.17, car.z);   // on top of the asphalt layers
      car.mesh.rotation.y = h;
    }

    function segLen(car) {
      const [ax, az, bx, bz] = segOf(car);
      return Math.hypot(bx - ax, bz - az) || 0.001;
    }

    // pick the next segment when the car reaches a polyline point
    function chooseNext(car) {
      const r = roads[car.ri];
      const n = r.pts.length / 2;
      const arriveIdx = car.dir > 0 ? car.i + 1 : car.i;
      const px = r.pts[arriveIdx * 2], pz = r.pts[arriveIdx * 2 + 1];
      const node = nodes.get(nodeKey(px, pz)) || [];
      const cands = [];
      for (const arm of node) {
        const r2 = roads[arm.ri], n2 = r2.pts.length / 2;
        for (const dir of [1, -1]) {
          if (dir === 1 && arm.i >= n2 - 1) continue;
          if (dir === -1 && (arm.i <= 0 || r2.oneway)) continue;
          const j = dir > 0 ? arm.i + 1 : arm.i - 1;
          let vx = r2.pts[j * 2] - px, vz = r2.pts[j * 2 + 1] - pz;
          const vl = Math.hypot(vx, vz) || 1; vx /= vl; vz /= vl;
          const dot = vx * car.ux + vz * car.uz;
          if (dot < -0.985) continue;                 // that's a U-turn
          const cls = OSM.ROAD_CLASSES[r2.cls] || OSM.ROAD_CLASSES.residential;
          let score = dot * 2 + (5 - cls.rank) * 0.15 + rand() * 0.9;
          if (arm.ri === car.ri) score += 0.35;       // slight bias to continue
          cands.push({ ri: arm.ri, i: dir > 0 ? arm.i : arm.i - 1, dir, score, dot });
        }
      }
      if (!cands.length) {
        // dead end: U-turn if the road allows it, else respawn elsewhere
        if (!r.oneway) {
          car.dir *= -1;
          car.i = car.dir > 0 ? Math.min(car.i, n - 2) : Math.max(car.i, 1) - 0;
          if (car.dir < 0 && car.i > n - 2) car.i = n - 2;
          car.t = 0;
          return true;
        }
        return false;
      }
      cands.sort((a, b) => b.score - a.score);
      const pick = cands[rand() < 0.65 ? 0 : (rand() * cands.length) | 0];
      car.ri = pick.ri; car.dir = pick.dir; car.t = 0;
      car.i = pick.dir > 0 ? pick.i : pick.i;
      if (pick.dir < 0) car.i = Math.max(0, pick.i);
      car.turnSharp = pick.dot < 0.5;
      return true;
    }

    function spawnCar(car, playerX, playerZ) {
      for (let tries = 0; tries < 25; tries++) {
        const ri = randomRoad();
        const r = roads[ri];
        const n = r.pts.length / 2;
        if (n < 2) continue;
        const i = (rand() * (n - 1)) | 0;
        const t = rand();
        const x = r.pts[i * 2] + (r.pts[i * 2 + 2] - r.pts[i * 2]) * t;
        const z = r.pts[i * 2 + 1] + (r.pts[i * 2 + 3] - r.pts[i * 2 + 1]) * t;
        const d = Math.hypot(x - playerX, z - playerZ);
        if (d < 120 || d > 1400) continue;
        let tooClose = false;
        for (const o of cars) {
          if (o.active && Math.hypot(o.x - x, o.z - z) < 25) { tooClose = true; break; }
        }
        if (tooClose) continue;
        car.ri = ri; car.i = i; car.dir = r.oneway ? 1 : (rand() < 0.5 ? 1 : -1);
        car.t = car.dir > 0 ? t : 1 - t;
        car.speed = speedLimitOf(car) * 0.5;
        car.stun = 0;
        car.active = true;
        car.mesh.visible = true;
        placeCar(car);
        return true;
      }
      return false;
    }

    function update(dt, player) {
      // maintain fleet around the player
      for (const car of cars) {
        if (!car.active) { spawnCar(car, player.x, player.z); continue; }
        if (Math.hypot(car.x - player.x, car.z - player.z) > 1700) {
          car.active = false; car.mesh.visible = false;
          continue;
        }
      }
      for (const car of cars) {
        if (!car.active) continue;
        if (car.stun > 0) { car.stun -= dt; car.speed = 0; continue; }

        let target = speedLimitOf(car);
        if (car.turnSharp && car.t < 0.3) target = Math.min(target, 6);

        // brake for cars/player ahead
        const look = 9 + car.speed * 1.9;
        let obsD = 1e9, obsSpeed = 0;
        const check = (ox, oz, ospeed, orad) => {
          const dx = ox - car.x, dz = oz - car.z;
          const fwd = dx * car.ux + dz * car.uz;
          if (fwd < 0.5 || fwd > look) return;
          const side = Math.abs(-dx * car.uz + dz * car.ux);
          if (side > 2.6) return;
          if (fwd < obsD) { obsD = fwd; obsSpeed = ospeed; }
        };
        for (const o of cars) {
          if (o === car || !o.active) continue;
          if (Math.abs(o.x - car.x) > look + 6 || Math.abs(o.z - car.z) > look + 6) continue;
          check(o.x, o.z, o.speed, 2.3);
        }
        check(player.x, player.z, player.speed, 2.6);
        if (player.parked) check(player.parked.x, player.parked.z, 0, 2.6);
        if (obsD < 1e9) {
          const safe = 7 + car.speed * 0.9;
          if (obsD < safe) target = Math.min(target, Math.max(0, obsSpeed - 0.5));
          if (obsD < 4.5) target = 0;
        }

        // stop for red lights (cars already on the junction keep going)
        if (signals) {
          const carAxis = Math.abs(car.ux) > Math.abs(car.uz) ? 'ew' : 'ns';
          const st = signals.stateFor(carAxis);
          if (st !== 'green') {
            for (const sig of signals.items) {
              const dxs = sig.x - car.x, dzs = sig.z - car.z;
              if (dxs > 50 || dxs < -50 || dzs > 50 || dzs < -50) continue;
              const fwd = dxs * car.ux + dzs * car.uz;
              if (fwd < 5 || fwd > 45) continue;
              const side = Math.abs(-dxs * car.uz + dzs * car.ux);
              if (side > 7) continue;
              if (fwd < 12) target = 0;
              else target = Math.min(target, (fwd - 10) * 0.55);
            }
          }
        }

        // accelerate / brake
        const acc = target > car.speed ? 2.6 : 8.5;
        car.speed += Math.sign(target - car.speed) * Math.min(Math.abs(target - car.speed), acc * dt);

        // advance along the polyline
        let dist = car.speed * dt;
        let guard = 0;
        while (dist > 0 && guard++ < 8) {
          const sl = segLen(car);
          const remain = (1 - car.t) * sl;
          if (dist < remain) { car.t += dist / sl; dist = 0; break; }
          dist -= remain;
          // step to next segment / junction
          if (car.dir > 0) {
            if (car.i + 1 < roads[car.ri].pts.length / 2 - 1) {
              const cont = maybeTurn(car);
              if (!cont) break;
            } else {
              if (!chooseNext(car)) { car.active = false; car.mesh.visible = false; break; }
            }
          } else {
            if (car.i > 0) {
              const cont = maybeTurn(car);
              if (!cont) break;
            } else {
              if (!chooseNext(car)) { car.active = false; car.mesh.visible = false; break; }
            }
          }
        }
        if (car.active) placeCar(car);
      }
    }

    // at interior polyline points: usually continue, but turn at junctions
    function maybeTurn(car) {
      const r = roads[car.ri];
      const arriveIdx = car.dir > 0 ? car.i + 1 : car.i;
      const px = r.pts[arriveIdx * 2], pz = r.pts[arriveIdx * 2 + 1];
      const node = nodes.get(nodeKey(px, pz)) || [];
      let junction = false;
      for (const arm of node) { if (arm.ri !== car.ri) { junction = true; break; } }
      if (junction && Math.random() < 0.4) {
        return chooseNext(car);
      }
      // continue straight on the same road
      car.i += car.dir > 0 ? 1 : -1;
      car.t = 0;
      car.turnSharp = false;
      return true;
    }

    return { cars, update };
  }

  return { prepare, create };
})();

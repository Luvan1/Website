/* ============================================================================
 * vehicles.js — Vehicle meshes.
 * Player car: Cadillac Escalade at true size (5.38 m × 2.06 m × 1.94 m,
 * 3.07 m wheelbase, 22" wheels).  Traffic: a small fleet of typical Duhok
 * street cars (white sedans, orange-and-white taxis, pickups, minibuses).
 * Models face +Z; 1 unit = 1 metre.
 * ==========================================================================*/
'use strict';

const VEHICLES = (() => {

  const M = {
    escBody:  new THREE.MeshPhongMaterial({ color: 0x0b0c0f, shininess: 95, specular: 0x555566 }),
    glass:    new THREE.MeshPhongMaterial({ color: 0x11151c, shininess: 120, specular: 0x8899aa }),
    chrome:   new THREE.MeshPhongMaterial({ color: 0xd8dde2, shininess: 140, specular: 0xffffff }),
    darkTrim: new THREE.MeshPhongMaterial({ color: 0x1c1e22, shininess: 30 }),
    tire:     new THREE.MeshLambertMaterial({ color: 0x151515 }),
    rim:      new THREE.MeshPhongMaterial({ color: 0xcfd4da, shininess: 130, specular: 0xffffff }),
    headlight:new THREE.MeshBasicMaterial({ color: 0xe8f2ff }),
    drl:      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    tailOff:  new THREE.MeshBasicMaterial({ color: 0x5a0d0d }),
    tailOn:   new THREE.MeshBasicMaterial({ color: 0xff2222 }),
    plate:    new THREE.MeshBasicMaterial({ color: 0xe8e8e8 }),
  };

  function bx(parent, mat, w, h, d, x, y, z, ry, rx) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    if (rx) m.rotation.x = rx;
    parent.add(m);
    return m;
  }

  /* ------------------------- Cadillac Escalade -------------------------- */
  function makeEscalade() {
    const g = new THREE.Group();
    const L = 5.38, W = 2.06, H = 1.94, WB = 3.07;
    const wheelR = 0.393;

    // main body slab (belt-line down)
    bx(g, M.escBody, W, 0.78, L, 0, 0.36 + 0.39, 0);          // 0.75 → 1.14
    // lower rocker / running boards
    bx(g, M.darkTrim, W + 0.10, 0.14, L * 0.60, 0, 0.42, 0);
    bx(g, M.chrome, 0.28, 0.06, 2.6, -(W / 2 + 0.10), 0.55, 0.1);
    bx(g, M.chrome, 0.28, 0.06, 2.6, (W / 2 + 0.10), 0.55, 0.1);
    // greenhouse (cabin glass band)
    bx(g, M.glass, W - 0.18, 0.62, 3.95, 0, 1.14 + 0.31, -0.42);
    // windshield (raked)
    bx(g, M.glass, W - 0.28, 0.72, 0.08, 0, 1.45, 1.62, 0, -0.42);
    // A/B/C/D pillars
    for (const z of [1.30, 0.35, -0.72, -2.36]) {
      bx(g, M.escBody, W - 0.16, 0.60, 0.10, 0, 1.45, z);
    }
    // roof
    bx(g, M.escBody, W - 0.20, 0.10, 4.05, 0, 1.90, -0.40);
    // roof rails
    bx(g, M.chrome, 0.07, 0.07, 3.3, -0.75, 1.98, -0.45);
    bx(g, M.chrome, 0.07, 0.07, 3.3, 0.75, 1.98, -0.45);
    // bonnet (hood) — slightly below beltline
    bx(g, M.escBody, W - 0.10, 0.10, 1.05, 0, 1.16, 2.05);
    // front fascia: tall chrome-mesh grille
    bx(g, M.darkTrim, 1.40, 0.72, 0.10, 0, 0.86, L / 2 - 0.02);
    for (let i = 0; i < 6; i++) {
      bx(g, M.chrome, 0.05, 0.66, 0.12, -0.55 + i * 0.22, 0.86, L / 2 + 0.01);
    }
    bx(g, M.chrome, 1.5, 0.05, 0.12, 0, 1.24, L / 2 - 0.01);   // grille top bar
    // Cadillac crest (stylised)
    bx(g, M.plate, 0.14, 0.16, 0.05, 0, 0.98, L / 2 + 0.07);
    // slim horizontal headlights
    bx(g, M.headlight, 0.44, 0.10, 0.06, -0.72, 1.22, L / 2 + 0.02);
    bx(g, M.headlight, 0.44, 0.10, 0.06, 0.72, 1.22, L / 2 + 0.02);
    // signature vertical DRL blades down the front corners
    bx(g, M.drl, 0.07, 0.52, 0.06, -0.94, 0.78, L / 2 + 0.02);
    bx(g, M.drl, 0.07, 0.52, 0.06, 0.94, 0.78, L / 2 + 0.02);
    // bumpers
    bx(g, M.darkTrim, W - 0.06, 0.30, 0.24, 0, 0.48, L / 2 - 0.08);
    bx(g, M.darkTrim, W - 0.06, 0.34, 0.22, 0, 0.50, -L / 2 + 0.06);
    // Escalade's trademark full-height vertical taillights
    const tailL = bx(g, M.tailOff, 0.12, 1.05, 0.07, -(W / 2 - 0.10), 1.28, -L / 2 - 0.01);
    const tailR = bx(g, M.tailOff, 0.12, 1.05, 0.07, (W / 2 - 0.10), 1.28, -L / 2 - 0.01);
    // liftgate chrome bar + plate
    bx(g, M.chrome, 1.2, 0.06, 0.06, 0, 1.30, -L / 2 - 0.02);
    bx(g, M.plate, 0.52, 0.26, 0.04, 0, 0.78, -L / 2 - 0.03);
    // door mirrors
    bx(g, M.escBody, 0.30, 0.16, 0.10, -(W / 2 + 0.12), 1.32, 1.05);
    bx(g, M.escBody, 0.30, 0.16, 0.10, (W / 2 + 0.12), 1.32, 1.05);

    // wheels: 22" chrome multi-spoke
    const wheels = [];
    const tireGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.31, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.32, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.34, 8);
    hubGeo.rotateZ(Math.PI / 2);
    for (const [sx, sz, steer] of [[-1, WB / 2, true], [1, WB / 2, true], [-1, -WB / 2, false], [1, -WB / 2, false]]) {
      const hub = new THREE.Group();                    // steering pivot
      hub.position.set(sx * (W / 2 - 0.14), wheelR, sz);
      const spin = new THREE.Group();                   // rolling rotation
      spin.add(new THREE.Mesh(tireGeo, M.tire));
      spin.add(new THREE.Mesh(rimGeo, M.rim));
      spin.add(new THREE.Mesh(hubGeo, M.darkTrim));
      // spokes so the rotation is visible
      for (let s = 0; s < 3; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.05), M.darkTrim);
        spoke.rotation.x = s * Math.PI / 3;
        spin.add(spoke);
      }
      hub.add(spin);
      g.add(hub);
      wheels.push({ hub, spin, steer });
    }

    g.userData = { L, W, H, WB, wheelR };
    return {
      group: g, wheels,
      dims: { L, W, H, WB, wheelR },
      setBrake(on) {
        tailL.material = tailR.material = on ? M.tailOn : M.tailOff;
      },
    };
  }

  /* ---------------------------- traffic fleet --------------------------- */

  const bodyMat = c => new THREE.MeshLambertMaterial({ color: c });
  const T_GLASS = new THREE.MeshLambertMaterial({ color: 0x20262e });
  const T_TIRE = new THREE.MeshLambertMaterial({ color: 0x181818 });

  function tWheel(parent, x, z, r) {
    const geo = new THREE.CylinderGeometry(r, r, 0.24, 10);
    geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, T_TIRE);
    m.position.set(x, r, z);
    parent.add(m);
  }

  function protoSedan(color) {
    const g = new THREE.Group();
    const mat = bodyMat(color);
    bx(g, mat, 1.78, 0.52, 4.5, 0, 0.55, 0);
    bx(g, T_GLASS, 1.6, 0.45, 2.1, 0, 1.03, -0.25);
    bx(g, mat, 1.62, 0.1, 2.2, 0, 1.28, -0.25);
    bx(g, new THREE.MeshBasicMaterial({ color: 0xdddddd }), 0.34, 0.1, 0.06, -0.6, 0.68, 2.26);
    bx(g, new THREE.MeshBasicMaterial({ color: 0xdddddd }), 0.34, 0.1, 0.06, 0.6, 0.68, 2.26);
    bx(g, new THREE.MeshBasicMaterial({ color: 0x881111 }), 0.34, 0.1, 0.06, -0.6, 0.68, -2.26);
    bx(g, new THREE.MeshBasicMaterial({ color: 0x881111 }), 0.34, 0.1, 0.06, 0.6, 0.68, -2.26);
    tWheel(g, -0.82, 1.35, 0.31); tWheel(g, 0.82, 1.35, 0.31);
    tWheel(g, -0.82, -1.35, 0.31); tWheel(g, 0.82, -1.35, 0.31);
    g.userData = { L: 4.5, W: 1.78 };
    return g;
  }

  function protoTaxi() {
    // classic Iraqi taxi: white with orange wings
    const g = protoSedan(0xf3f3ef);
    const orange = bodyMat(0xd9822b);
    bx(g, orange, 1.8, 0.5, 0.9, 0, 0.56, 1.85);
    bx(g, orange, 1.8, 0.5, 0.9, 0, 0.56, -1.85);
    bx(g, bodyMat(0xfff2c9), 0.5, 0.22, 0.5, 0, 1.42, -0.25);   // roof sign
    return g;
  }

  function protoPickup(color) {
    const g = new THREE.Group();
    const mat = bodyMat(color);
    bx(g, mat, 1.85, 0.6, 5.2, 0, 0.62, 0);
    bx(g, T_GLASS, 1.7, 0.5, 1.5, 0, 1.15, 0.9);
    bx(g, mat, 1.72, 0.1, 1.6, 0, 1.42, 0.9);
    bx(g, bodyMat(0x2a2d31), 1.65, 0.12, 2.2, 0, 0.95, -1.35);  // bed
    tWheel(g, -0.88, 1.6, 0.36); tWheel(g, 0.88, 1.6, 0.36);
    tWheel(g, -0.88, -1.5, 0.36); tWheel(g, 0.88, -1.5, 0.36);
    g.userData = { L: 5.2, W: 1.85 };
    return g;
  }

  function protoMinibus() {
    const g = new THREE.Group();
    const mat = bodyMat(0xeeeeea);
    bx(g, mat, 1.95, 1.5, 5.6, 0, 1.05, 0);
    bx(g, T_GLASS, 1.97, 0.5, 3.6, 0, 1.55, -0.4);
    bx(g, T_GLASS, 1.75, 0.55, 0.1, 0, 1.5, 2.81);
    bx(g, bodyMat(0x8a8f96), 1.9, 0.3, 0.3, 0, 0.35, 2.7);
    tWheel(g, -0.9, 1.75, 0.35); tWheel(g, 0.9, 1.75, 0.35);
    tWheel(g, -0.9, -1.75, 0.35); tWheel(g, 0.9, -1.75, 0.35);
    g.userData = { L: 5.6, W: 1.95 };
    return g;
  }

  function protoSuv(color) {
    const g = new THREE.Group();
    const mat = bodyMat(color);
    bx(g, mat, 1.9, 0.75, 4.8, 0, 0.75, 0);
    bx(g, T_GLASS, 1.75, 0.55, 3.2, 0, 1.4, -0.3);
    bx(g, mat, 1.78, 0.1, 3.3, 0, 1.7, -0.3);
    tWheel(g, -0.86, 1.45, 0.37); tWheel(g, 0.86, 1.45, 0.37);
    tWheel(g, -0.86, -1.45, 0.37); tWheel(g, 0.86, -1.45, 0.37);
    g.userData = { L: 4.8, W: 1.9 };
    return g;
  }

  let PROTOS = null;
  function trafficProtos() {
    if (!PROTOS) {
      PROTOS = [
        protoSedan(0xf1f1ec), protoSedan(0xc7cbd1), protoSedan(0x9aa0a8),
        protoSedan(0x3a3f46), protoSedan(0x7a1f1f), protoSedan(0x2c4a6e),
        protoTaxi(), protoTaxi(),
        protoPickup(0xe8e8e2), protoPickup(0x54585e),
        protoMinibus(),
        protoSuv(0x23262b), protoSuv(0xdfdfda), protoSuv(0x4c3a2a),
      ];
    }
    return PROTOS;
  }

  function makeTrafficCar(i) {
    const protos = trafficProtos();
    const proto = protos[i % protos.length];
    const g = proto.clone();
    g.userData = { ...proto.userData };
    return g;
  }

  /* ----------------------------- pedestrian ----------------------------- */
  // Simple 1.75 m walker for exploring landmarks on foot.  Limb groups are
  // returned so main.js can swing them while walking.
  function makePedestrian() {
    const g = new THREE.Group();
    const skin = bodyMat(0xd8a877), shirt = bodyMat(0x3f6d9e),
          pants = bodyMat(0x2c2f36), hair = bodyMat(0x2a221c),
          shoe = bodyMat(0x1c1c1e);
    // torso + head
    bx(g, shirt, 0.42, 0.62, 0.24, 0, 1.18, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), skin);
    head.position.set(0, 1.63, 0); g.add(head);
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hair);
    hairCap.position.set(0, 1.65, 0); g.add(hairCap);
    // limbs pivot at shoulder/hip
    const limb = (mat, w, len, x, y) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), mat);
      m.position.y = -len / 2;
      pivot.add(m);
      g.add(pivot);
      return pivot;
    };
    const lArm = limb(shirt, 0.11, 0.58, -0.28, 1.46);
    const rArm = limb(shirt, 0.11, 0.58, 0.28, 1.46);
    const lLeg = limb(pants, 0.15, 0.82, -0.11, 0.87);
    const rLeg = limb(pants, 0.15, 0.82, 0.11, 0.87);
    // shoes attached to legs
    for (const leg of [lLeg, rLeg]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.28), shoe);
      s.position.set(0, -0.82, 0.05);
      leg.add(s);
    }
    return { group: g, limbs: { lArm, rArm, lLeg, rLeg } };
  }

  return { makeEscalade, makeTrafficCar, makePedestrian };
})();

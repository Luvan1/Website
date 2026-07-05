/* ============================================================================
 * main.js — Duhok Drive: game loop, driving physics, chase camera, HUD,
 * minimap and audio.  Everything is metric: 1 unit = 1 metre, speeds in m/s.
 * ==========================================================================*/
'use strict';

window.__DUHOK_BOOTED__ = true;   // index.html checks this to detect missing files

(() => {

  /* ------------------------------- helpers ------------------------------ */
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerpAngle = (a, b, t) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  };
  const params = new URLSearchParams(location.search);

  /* ------------------------------ renderer ------------------------------ */
  let renderer, scene, camera, world, traffic, player, audio;
  let city = null;
  let running = false;

  function initRenderer() {
    renderer = new THREE.WebGLRenderer({ canvas: $('game'), antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd6ea);
    scene.fog = new THREE.Fog(0xc4d4e0, 900, 4200);
    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.3, 9000);
    addLights();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  }

  function addLights() {
    const hemi = new THREE.HemisphereLight(0xd8e8ff, 0x8a7a5a, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2dd, 1.35);
    sun.position.set(-1400, 1800, 900);
    scene.add(sun);
  }

  /* -------------------------------- input ------------------------------- */
  const input = { fwd: 0, back: 0, left: 0, right: 0, hand: 0 };
  const KEYMAP = {
    KeyW: 'fwd', ArrowUp: 'fwd', KeyS: 'back', ArrowDown: 'back',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    Space: 'hand',
  };
  function initInput() {
    window.addEventListener('keydown', e => {
      const k = KEYMAP[e.code];
      if (k) { input[k] = 1; e.preventDefault(); }
      if (e.code === 'KeyC') cycleCamera();
      if (e.code === 'KeyM') toggleMap();
      if (e.code === 'KeyR') resetToRoad();
      if (e.code === 'KeyH') audio && audio.horn();
    });
    window.addEventListener('keyup', e => {
      const k = KEYMAP[e.code];
      if (k) input[k] = 0;
    });
    // touch controls
    if ('ontouchstart' in window) {
      $('touch').style.display = 'flex';
      const bind = (id, key) => {
        const el = $(id);
        el.addEventListener('touchstart', e => { input[key] = 1; e.preventDefault(); }, { passive: false });
        el.addEventListener('touchend', e => { input[key] = 0; e.preventDefault(); }, { passive: false });
      };
      bind('t-left', 'left'); bind('t-right', 'right');
      bind('t-gas', 'fwd'); bind('t-brake', 'back');
    }
  }

  /* ------------------------------- player ------------------------------- */
  function initPlayer() {
    const esc = VEHICLES.makeEscalade();
    scene.add(esc.group);
    player = {
      car: esc,
      x: 0, z: 0, y: 0, heading: 0,
      v: 0, steer: 0, wheelSpin: 0,
      speed: 0,           // |v| for traffic API
      offroad: false,
      camMode: 0, camPos: new THREE.Vector3(0, 6, -12), shake: 0,
    };
    // spawn on a road near the Grand Bazaar (city centre)
    const centre = OSM.project(36.8585, 42.9930);
    const near = world.nearestRoad(centre.x, centre.z, 800);
    if (near) {
      // put the car on the actual road line
      const hit = world.roadIndex.nearest(centre.x, centre.z, 800);
      const s = hit.seg;
      player.x = (s.ax + s.bx) / 2;
      player.z = (s.az + s.bz) / 2;
      player.heading = Math.atan2(s.bx - s.ax, s.bz - s.az);
    } else {
      player.x = centre.x; player.z = centre.z;
    }
    player.camPos.set(player.x - Math.sin(player.heading) * 12, 5, player.z - Math.cos(player.heading) * 12);
  }

  function resetToRoad() {
    const hit = world.roadIndex.nearest(player.x, player.z, 2500);
    if (!hit) return;
    const s = hit.seg;
    // nearest point on segment
    const dx = s.bx - s.ax, dz = s.bz - s.az;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((player.x - s.ax) * dx + (player.z - s.az) * dz) / len2;
    t = clamp(t, 0, 1);
    player.x = s.ax + dx * t; player.z = s.az + dz * t;
    player.heading = Math.atan2(dx, dz);
    player.v = 0;
    toast('Back on the road');
  }

  const ESC = { vmax: 50, vmaxRev: -9, wb: 3.07 };

  function updatePlayer(dt) {
    const p = player;
    const throttle = input.fwd, reverse = input.back;

    // --- longitudinal
    let a = 0;
    if (throttle) {
      if (p.v >= 0) a = 4.4 * (1 - p.v / ESC.vmax);
      else a = 8.5;                                   // braking out of reverse
    }
    if (reverse) {
      if (p.v > 0.5) a = -8.8;                        // brake
      else a = -3.4 * (1 - p.v / ESC.vmaxRev);        // reverse
    }
    if (input.hand) a -= Math.sign(p.v) * 6.5;
    // drag + rolling resistance
    a -= Math.sign(p.v) * (0.0004 * p.v * p.v * 9 + 0.35);

    // --- off-road handling
    const road = world.nearestRoad(p.x, p.z, 160);
    p.offroad = !road || road.d > road.halfW + 2.0;
    if (p.offroad) {
      a -= Math.sign(p.v) * 1.6;
      if (Math.abs(p.v) > 17) a -= Math.sign(p.v) * 2.5;
    }
    p.roadName = road && road.d < road.halfW + 12 ? road.name : '';

    const vPrev = p.v;
    p.v += a * dt;
    if (!throttle && !reverse && Math.abs(p.v) < 0.35) p.v = 0;
    if (vPrev > 0 && p.v < 0 && !reverse) p.v = 0;
    p.v = clamp(p.v, ESC.vmaxRev, ESC.vmax);

    // --- steering
    const steerMax = 0.62 / (1 + Math.abs(p.v) / 13);
    const steerTarget = (input.left - input.right) * steerMax;
    p.steer += (steerTarget - p.steer) * Math.min(1, dt * 7);
    let yaw = (p.v / ESC.wb) * Math.tan(p.steer);
    // lateral grip limit (understeer at speed; handbrake loosens the rear)
    const gripA = input.hand ? 12.5 : 8.6;
    if (Math.abs(yaw * p.v) > gripA) yaw = Math.sign(yaw) * gripA / Math.abs(p.v);
    p.heading += yaw * dt;

    // --- integrate
    p.x += Math.sin(p.heading) * p.v * dt;
    p.z += Math.cos(p.heading) * p.v * dt;
    p.speed = Math.abs(p.v);

    // --- collisions with buildings / landmarks
    const fx = Math.sin(p.heading), fz = Math.cos(p.heading);
    for (const [ox, oz] of [[fx * 1.6, fz * 1.6], [-fx * 1.6, -fz * 1.6]]) {
      const cx = p.x + ox, cz = p.z + oz, r = 1.12;
      for (const b of world.collisions.query(cx, cz, r + 1)) {
        const nx = clamp(cx, b.x0, b.x1), nz = clamp(cz, b.z0, b.z1);
        const dx = cx - nx, dz = cz - nz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2) || 0.001;
        const push = (r - d);
        p.x += (dx / d) * push; p.z += (dz / d) * push;
        if (Math.abs(p.v) > 8) { audio && audio.crash(); p.shake = 0.5; }
        else if (Math.abs(p.v) > 2) p.shake = 0.2;
        p.v *= 0.35;
      }
    }

    // --- collisions with traffic
    for (const car of traffic.cars) {
      if (!car.active) continue;
      const ddx = car.x - p.x, ddz = car.z - p.z;
      if (ddx * ddx + ddz * ddz > 100) continue;
      // two circles per vehicle
      for (const po of [1.6, -1.6]) {
        const pcx = p.x + fx * po, pcz = p.z + fz * po;
        for (const co of [car.halfLen * 0.6, -car.halfLen * 0.6]) {
          const ccx = car.x + Math.sin(car.heading) * co;
          const ccz = car.z + Math.cos(car.heading) * co;
          const dx = pcx - ccx, dz = pcz - ccz;
          const rr = 1.12 + 1.05;
          const d2 = dx * dx + dz * dz;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || 0.001;
          const push = (rr - d) / 2;
          p.x += (dx / d) * push; p.z += (dz / d) * push;
          car.stun = 1.6 + Math.random();
          if (Math.abs(p.v) > 6) { audio && audio.crash(); p.shake = 0.45; }
          audio && audio.hornFar();
          p.v *= 0.5;
        }
      }
    }

    // --- ground height (off-road onto the hills)
    p.y = world.heightAt(p.x, p.z);

    // --- car mesh
    const g = p.car.group;
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = p.heading;
    // body lean + off-road bumping
    const bump = p.offroad && p.speed > 3 ? (Math.random() - 0.5) * 0.02 : 0;
    g.rotation.z = clamp(-yaw * p.v * 0.012, -0.06, 0.06) + bump;
    g.rotation.x = clamp(-(a) * 0.004, -0.04, 0.05);
    // wheels
    p.wheelSpin += (p.v / 0.393) * dt;
    for (const w of p.car.wheels) {
      w.spin.rotation.x = p.wheelSpin;
      if (w.steer) w.hub.rotation.y = p.steer * 1.15;
    }
    p.car.setBrake((reverse && p.v > 0.5) || (input.hand && p.speed > 0.5));

    if (p.shake > 0) p.shake = Math.max(0, p.shake - dt * 1.4);
  }

  /* ------------------------------- camera -------------------------------- */
  const CAMS = [
    { d: 11.5, h: 4.4, look: 7, fov: 62 },   // chase
    { d: 7.6, h: 3.0, look: 5, fov: 65 },    // close chase
    { d: -0.4, h: 2.05, look: 30, fov: 70 }, // hood
  ];
  function cycleCamera() { player.camMode = (player.camMode + 1) % CAMS.length; }

  function updateCamera(dt) {
    const p = player, c = CAMS[p.camMode];
    const fx = Math.sin(p.heading), fz = Math.cos(p.heading);
    const tx = p.x - fx * c.d, tz = p.z - fz * c.d;
    const ty = p.y + c.h + (c.d > 0 ? Math.max(0, world.heightAt(tx, tz) - p.y) : 0);
    const k = c.d > 0 ? 1 - Math.exp(-dt * 5) : 1;
    p.camPos.x += (tx - p.camPos.x) * k;
    p.camPos.y += (ty - p.camPos.y) * k;
    p.camPos.z += (tz - p.camPos.z) * k;
    camera.position.copy(p.camPos);
    if (p.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * p.shake;
      camera.position.y += (Math.random() - 0.5) * p.shake * 0.6;
    }
    camera.lookAt(p.x + fx * c.look, p.y + 1.7, p.z + fz * c.look);
    const targetFov = c.fov + p.speed * 0.18;
    camera.fov += (clamp(targetFov, c.fov, c.fov + 10) - camera.fov) * Math.min(1, dt * 3);
    camera.updateProjectionMatrix();
  }

  /* ------------------------------ minimap -------------------------------- */
  let mapCanvas, mapCtx, mapScale, mapX0, mapZ0, mapBig = false;

  function prerenderMap() {
    // world extent from the OSM bbox
    const a = OSM.project(OSM.BBOX.n, OSM.BBOX.w);   // north-west
    const b = OSM.project(OSM.BBOX.s, OSM.BBOX.e);   // south-east
    const w = b.x - a.x, h = b.z - a.z;
    mapCanvas = document.createElement('canvas');
    const PX = 2200;
    mapScale = PX / w;
    mapCanvas.width = PX;
    mapCanvas.height = Math.ceil(h * mapScale);
    mapX0 = a.x; mapZ0 = a.z;
    const ctx = mapCanvas.getContext('2d');
    ctx.fillStyle = '#20242c';
    ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    const toPx = (x, z) => [(x - mapX0) * mapScale, (z - mapZ0) * mapScale];
    // greens & water
    ctx.fillStyle = '#2e4426';
    for (const g of city.greens || []) fillPoly(ctx, g, toPx);
    ctx.fillStyle = '#1d4d6e';
    for (const wp of city.waters || []) fillPoly(ctx, wp, toPx);
    // roads
    const style = {
      trunk: ['#e8b84c', 4.2], motorway: ['#e8b84c', 4.2], primary: ['#e8d28a', 3.4],
      secondary: ['#c9cdd4', 2.6], tertiary: ['#a9adb6', 2.0],
    };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const pass of [0, 1]) {
      for (const r of city.roads) {
        const st = style[r.cls];
        if (pass === 0 && st) continue;
        if (pass === 1 && !st) continue;
        ctx.strokeStyle = st ? st[0] : '#6c717b';
        ctx.lineWidth = st ? st[1] : 1.1;
        ctx.beginPath();
        ctx.moveTo(...toPx(r.pts[0], r.pts[1]));
        for (let i = 1; i < r.pts.length / 2; i++) ctx.lineTo(...toPx(r.pts[i * 2], r.pts[i * 2 + 1]));
        ctx.stroke();
      }
    }
    mapCtx = $('minimap').getContext('2d');
  }
  function fillPoly(ctx, poly, toPx) {
    if (poly.length < 6) return;
    ctx.beginPath();
    ctx.moveTo(...toPx(poly[0], poly[1]));
    for (let i = 1; i < poly.length / 2; i++) ctx.lineTo(...toPx(poly[i * 2], poly[i * 2 + 1]));
    ctx.closePath(); ctx.fill();
  }

  function drawMinimap() {
    const cv = $('minimap');
    const S = cv.width;
    const ctx = mapCtx;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#20242c';
    ctx.fillRect(0, 0, S, S);
    const px = (player.x - mapX0) * mapScale, pz = (player.z - mapZ0) * mapScale;
    const zoom = 1.55;                     // minimap zoom (px per map-px)
    ctx.translate(S / 2, S / 2);
    ctx.rotate(player.heading + Math.PI);
    ctx.scale(zoom, zoom);
    ctx.translate(-px, -pz);
    ctx.drawImage(mapCanvas, 0, 0);
    // traffic dots
    ctx.fillStyle = '#ffd75e';
    for (const c of traffic.cars) {
      if (!c.active) continue;
      const cx = (c.x - mapX0) * mapScale, cz = (c.z - mapZ0) * mapScale;
      ctx.fillRect(cx - 1.3, cz - 1.3, 2.6, 2.6);
    }
    // landmarks
    ctx.fillStyle = '#7fd4ff';
    for (const lm of OSM.LANDMARKS) {
      const p = OSM.project(lm.lat, lm.lon);
      const cx = (p.x - mapX0) * mapScale, cz = (p.z - mapZ0) * mapScale;
      ctx.beginPath(); ctx.arc(cx, cz, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // player arrow
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(-5, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // north tick
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate(player.heading + Math.PI);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('N', 0, -S / 2 + 16);
    ctx.restore();
  }

  function toggleMap() {
    mapBig = !mapBig;
    $('bigmap-wrap').style.display = mapBig ? 'flex' : 'none';
    if (mapBig) drawBigMap();
  }
  function drawBigMap() {
    const cv = $('bigmap');
    const W = Math.min(window.innerWidth, window.innerHeight) - 60;
    cv.width = W; cv.height = W * (mapCanvas.height / mapCanvas.width);
    const ctx = cv.getContext('2d');
    const s = W / mapCanvas.width;
    ctx.drawImage(mapCanvas, 0, 0, cv.width, cv.height);
    ctx.font = 'bold 12px system-ui';
    for (const lm of OSM.LANDMARKS) {
      const p = OSM.project(lm.lat, lm.lon);
      const x = (p.x - mapX0) * mapScale * s, y = (p.z - mapZ0) * mapScale * s;
      ctx.fillStyle = '#7fd4ff';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(lm.name, x + 7, y + 4);
    }
    const x = (player.x - mapX0) * mapScale * s, y = (player.z - mapZ0) * mapScale * s;
    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  }

  /* -------------------------------- HUD ---------------------------------- */
  let lastToastLm = {}, hudTimer = 0;
  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function updateHUD(dt) {
    hudTimer -= dt;
    $('speed').textContent = Math.round(player.speed * 3.6);
    if (hudTimer <= 0) {
      hudTimer = 0.25;
      $('roadname').textContent = player.roadName || (player.offroad ? 'off-road' : '');
      // landmark proximity
      for (const lm of OSM.LANDMARKS) {
        const p = OSM.project(lm.lat, lm.lon);
        const d = Math.hypot(p.x - player.x, p.z - player.z);
        if (d < 280 && (!lastToastLm[lm.id] || performance.now() - lastToastLm[lm.id] > 90000)) {
          lastToastLm[lm.id] = performance.now();
          toast('📍 ' + lm.name);
        }
      }
    }
  }

  /* -------------------------------- audio -------------------------------- */
  function initAudio() {
    let ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return null; }
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    // engine: two detuned saws through a lowpass
    const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth'; osc2.type = 'sawtooth';
    const eg = ctx.createGain(); eg.gain.value = 0.0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    osc1.connect(eg); osc2.connect(eg);
    eg.connect(lp); lp.connect(master);
    osc1.start(); osc2.start();
    let muted = false;
    return {
      ctx,
      update(speed, throttle) {
        const rpm = 42 + speed * 3.1 + throttle * 14;
        osc1.frequency.setTargetAtTime(rpm, ctx.currentTime, 0.06);
        osc2.frequency.setTargetAtTime(rpm * 1.503, ctx.currentTime, 0.06);
        eg.gain.setTargetAtTime(muted ? 0 : 0.045 + throttle * 0.05 + Math.min(speed, 40) * 0.0012, ctx.currentTime, 0.1);
      },
      horn() {
        if (muted) return;
        const t = ctx.currentTime;
        for (const f of [400, 505]) {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'square'; o.frequency.value = f;
          g.gain.setValueAtTime(0.06, t);
          g.gain.setTargetAtTime(0, t + 0.35, 0.05);
          o.connect(g); g.connect(master);
          o.start(t); o.stop(t + 0.6);
        }
      },
      hornFar() {
        if (muted || Math.random() < 0.6) return;
        const t = ctx.currentTime;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 350 + Math.random() * 150;
        g.gain.setValueAtTime(0.025, t);
        g.gain.setTargetAtTime(0, t + 0.25, 0.05);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.5);
      },
      crash() {
        if (muted) return;
        const t = ctx.currentTime;
        const len = 0.25, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g = ctx.createGain(); g.gain.value = 0.18;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
        src.connect(f); f.connect(g); g.connect(master);
        src.start(t);
      },
      toggleMute() { muted = !muted; return muted; },
    };
  }

  /* ------------------------------ main loop ------------------------------ */
  let lastT = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (!running) return;
    const dt = clamp((t - lastT) / 1000, 0.001, 0.1);
    lastT = t;
    updatePlayer(dt);
    traffic.update(dt, player);
    world.update(dt, player.x, player.z);
    updateCamera(dt);
    updateHUD(dt);
    drawMinimap();
    if (audio) audio.update(player.speed, input.fwd);
    renderer.render(scene, camera);
    // lightweight debug surface (used by the automated tests)
    window.__DUHOK_DEBUG__ = {
      px: player.x, pz: player.z, v: player.v,
      trafficActive: traffic.cars.filter(c => c.active).length,
      trafficMoving: traffic.cars.filter(c => c.active && c.speed > 1).length,
      roadCount: city.roads.length,
      buildingCount: (city.buildings || []).length,
      source: city.source,
    };
  }

  /* ------------------------------- boot ---------------------------------- */
  async function boot() {
    const status = msg => { $('load-status').textContent = msg; };

    try {
      initRenderer();
    } catch (e) {
      console.error(e);
      status('Could not start 3D graphics (WebGL). Try another browser, or enable hardware acceleration.');
      $('load-row').querySelector('.spin').style.display = 'none';
      return;
    }
    initInput();

    // never leave the player stuck on the loading screen:
    // a skip button appears after a few seconds, and after 90 s we give up
    // on the download automatically and use the bundled map.
    const skipBtn = $('skipbtn');
    const skipTimer = setTimeout(() => { skipBtn.style.display = 'inline-block'; }, 6000);
    const giveUpTimer = setTimeout(() => { OSM.skipLive(); }, 90000);
    skipBtn.onclick = () => {
      skipBtn.disabled = true;
      status('Skipping the download — using the offline map…');
      OSM.skipLive();
    };

    const opts = {
      onStatus: status,
      forceOffline: params.get('offline') === '1',
      forceRefresh: params.get('refresh') === '1',
      overpassUrl: params.get('overpass') || undefined,
    };
    try {
      city = await OSM.loadCity(opts);
    } catch (e) {
      console.error(e);
      city = FALLBACK_MAP.build();
    }
    clearTimeout(skipTimer);
    clearTimeout(giveUpTimer);
    skipBtn.style.display = 'none';

    status('Building the city…');
    await new Promise(r => setTimeout(r, 30));   // let the status paint

    const buildAll = () => {
      const nodes = TRAFFIC.prepare(city);
      world = WORLD.buildWorld(scene, city);
      traffic = TRAFFIC.create(scene, city, nodes, { count: 46 });
      initPlayer();
      prerenderMap();
    };
    try {
      buildAll();
    } catch (e) {
      // a malformed live dataset must never brick the game — rebuild offline
      console.error('world build failed, retrying with the offline map', e);
      if (city.source === 'osm') {
        try {
          scene.clear();
          addLights();
          city = FALLBACK_MAP.build();
          buildAll();
        } catch (e2) {
          console.error(e2);
          status('Failed to build the city: ' + (e2 && e2.message || e2));
          return;
        }
      } else {
        status('Failed to build the city: ' + (e && e.message || e));
        return;
      }
    }

    // source badge
    const badge = $('srcbadge');
    if (city.source === 'osm') {
      badge.textContent = city.fromCache
        ? '✓ Real OpenStreetMap data (cached)' : '✓ Real OpenStreetMap data (live)';
      badge.classList.add('live');
    } else {
      badge.textContent = '⚠ Offline map (approximate) — open with internet for the real streets';
    }
    $('attribution').textContent = city.attribution || '';

    $('load-row').style.display = 'none';
    const btn = $('startbtn');
    btn.disabled = false;
    btn.textContent = 'START DRIVING';
    btn.onclick = () => {
      $('overlay').style.display = 'none';
      audio = initAudio();
      running = true;
      lastT = performance.now();
      if (city.source !== 'osm') {
        setTimeout(() => toast('⚠ Offline approximate map — reload with internet for the real Duhok streets'), 1500);
      }
    };
    $('refreshbtn').onclick = async () => {
      await OSM.clearCache();
      location.search = '?refresh=1';
    };

    // debug/testing hook: teleport to a lat/lon facing a compass bearing
    // (0 = north, 90 = east), e.g. from the browser console.
    window.__DUHOK_TP__ = (lat, lon, bearingDeg) => {
      const p = OSM.project(lat, lon);
      player.x = p.x; player.z = p.z; player.v = 0;
      if (bearingDeg !== undefined) player.heading = Math.PI - bearingDeg * Math.PI / 180;
      player.camPos.set(player.x - Math.sin(player.heading) * 12, player.y + 5,
        player.z - Math.cos(player.heading) * 12);
    };
  }

  window.addEventListener('DOMContentLoaded', () => {
    boot();
    requestAnimationFrame(frame);
  });
})();

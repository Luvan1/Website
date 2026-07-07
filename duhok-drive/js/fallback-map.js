/* ============================================================================
 * fallback-map.js — Bundled offline approximation of Duhok.
 *
 * Used ONLY when OpenStreetMap cannot be reached.  The arterial layout below
 * is hand-built from the real geography of Duhok and anchored to verified
 * coordinates (dam, stadium, university, Azadi Park), but minor streets are
 * a plausible procedural fill — with an internet connection the game loads
 * the genuine street network instead (see osm.js).
 * ==========================================================================*/
'use strict';

const FALLBACK_MAP = (() => {

  // simple deterministic RNG so the fallback city is identical every run
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function path(latlons) {
    const pts = [];
    for (const [lat, lon] of latlons) {
      const p = OSM.project(lat, lon);
      pts.push(p.x, p.z);
    }
    return pts;
  }

  function build() {
    const roads = [];
    const R = (name, cls, latlons, oneway) =>
      roads.push({ name, cls, oneway: !!oneway, pts: path(latlons) });

    /* ------------------------- Main arteries --------------------------- */

    // Route 2 — Zakho Way: enters from the west, skirts the south of the city
    R('Zakho Way', 'trunk', [
      [36.8500, 42.9000], [36.8515, 42.9130], [36.8530, 42.9260],
      [36.8545, 42.9400], [36.8558, 42.9520], [36.8568, 42.9650],
      [36.8565, 42.9760], [36.8540, 42.9855], [36.8480, 42.9890],
    ]);
    // Route 2 continues south to Mosul through the Gali Duhok gorge
    R('Mosul Road (Gali Duhok)', 'trunk', [
      [36.8480, 42.9890], [36.8410, 42.9887], [36.8350, 42.9895],
      [36.8290, 42.9885], [36.8220, 42.9875], [36.8180, 42.9870],
    ]);
    // KRO Street — the big east-west artery across the north of the city
    R('KRO Street', 'primary', [
      [36.8640, 42.9370], [36.8660, 42.9450], [36.8680, 42.9560],
      [36.8692, 42.9700], [36.8700, 42.9850], [36.8695, 43.0000],
      [36.8688, 43.0150], [36.8680, 43.0250],
    ]);
    // 11 Aylul Street — historic main street through the bazaar
    R('11 Aylul Street', 'primary', [
      [36.8588, 42.9760], [36.8585, 42.9860], [36.8585, 42.9930],
      [36.8600, 43.0000], [36.8620, 43.0060], [36.8640, 43.0100],
      [36.8688, 43.0150],
    ]);
    // Barzani Street — between KRO and 11 Aylul
    R('Barzani Street', 'secondary', [
      [36.8628, 42.9600], [36.8638, 42.9750], [36.8645, 42.9880],
      [36.8652, 42.9990], [36.8662, 43.0080],
    ]);
    // Road up to the dam: climbs the east abutment, then runs the full
    // crest between the real endpoints (west end is a viewpoint dead-end)
    R('Duhok Dam Road', 'secondary', [
      [36.8695, 43.0000], [36.8712, 43.0032], [36.8727, 43.0062],
      [36.8742, 43.0080], [36.87576, 43.00753],
      [36.87661, 43.00021],
    ]);
    // Amedi Road — heads north-east out of the city towards Zawita
    R('Amedi Road', 'trunk', [
      [36.8680, 43.0250], [36.8705, 43.0330], [36.8712, 43.0400],
      [36.8760, 43.0520], [36.8790, 43.0600],
    ]);
    // Malta Road — south from the bazaar past the stadium and Azadi Park
    R('Malta Road', 'primary', [
      [36.8585, 42.9930], [36.8550, 42.9948], [36.8520, 42.9958],
      [36.8490, 42.9965], [36.8472, 43.0050], [36.8462, 43.0150],
    ]);
    // University Street — loops by the University of Duhok campus
    R('University Street', 'secondary', [
      [36.8585, 42.9860], [36.8600, 42.9862], [36.8618, 42.9869],
      [36.8635, 42.9876], [36.8645, 42.9880],
    ]);
    // Dream City road on the western entrance
    R('Dream City Road', 'secondary', [
      [36.8530, 42.9260], [36.8580, 42.9280], [36.8630, 42.9300],
      [36.8665, 42.9320], [36.8640, 42.9370],
    ]);
    // Mazi / Qazi Muhammad road
    R('Qazi Muhammad Road', 'secondary', [
      [36.8568, 42.9650], [36.8590, 42.9720], [36.8600, 42.9820],
      [36.8588, 42.9760],
    ]);
    // North ring through Shindokha
    R('Shindokha Road', 'secondary', [
      [36.8680, 42.9560], [36.8712, 42.9650], [36.8725, 42.9800],
      [36.8712, 42.9930], [36.8695, 43.0000],
    ]);
    // Stadium/Azadi link back west to Zakho Way
    R('Stadium Road', 'secondary', [
      [36.8480, 42.9890], [36.8500, 42.9925], [36.8520, 42.9958],
    ]);
    // Family Mall access
    R('Family Mall Road', 'tertiary', [
      [36.8545, 42.9400], [36.8560, 42.9480], [36.8580, 42.9520],
      [36.8558, 42.9520],
    ]);
    // Duhok Mall access
    R('Duhok Mall Road', 'tertiary', [
      [36.8660, 42.9450], [36.8690, 42.9530], [36.8710, 42.9600],
      [36.8720, 42.9660], [36.8712, 42.9650],
    ]);
    // Malta east up to Amedi road
    R('Malta East Road', 'tertiary', [
      [36.8462, 43.0150], [36.8530, 43.0190], [36.8600, 43.0220],
      [36.8680, 43.0250],
    ]);

    // North-south connectors between the main east-west arteries
    const connectors = [
      ['Nizarke Connector',  42.9450, 36.8545, 36.8660],
      ['Bahdinan Connector', 42.9600, 36.8568, 36.8628],
      ['Baroshke Connector', 42.9750, 36.8565, 36.8638],
      ['Center Connector',   42.9900, 36.8540, 36.8644],
      ['Masike Connector',   42.9860, 36.8585, 36.8700],
      ['KRO Connector',      43.0060, 36.8620, 36.8690],
    ];
    for (const [name, lon, latA, latB] of connectors) {
      R(name, 'tertiary', [[latA, lon], [(latA + latB) / 2, lon + 0.0004], [latB, lon]]);
    }

    /* ------------------- Residential district grids -------------------- */
    const rand = mulberry32(1988);   // year the Duhok Dam was completed
    const districts = [
      // [latMin, latMax, lonMin, lonMax, spacing metres]
      [36.8600, 36.8676, 42.9380, 42.9560, 115],   // Nizarke (west)
      [36.8684, 36.8745, 42.9560, 42.9740, 105],   // Shindokha (north-west)
      [36.8615, 36.8688, 42.9760, 42.9948, 95],    // Masike / centre-north
      [36.8626, 36.8698, 43.0004, 43.0140, 105],   // KRO east
      [36.8440, 36.8528, 42.9900, 43.0110, 110],   // Malta (south-east)
      [36.8515, 36.8580, 42.9700, 42.9900, 100],   // Baroshke (south-centre)
      [36.8560, 36.8620, 42.9310, 42.9375, 110],   // Dream City blocks
    ];
    const dLat = 1 / 110976, dLon = 1 / 89174;     // one metre in degrees
    let gi = 0;
    for (const [latA, latB, lonA, lonB, sp] of districts) {
      const stepLat = sp * dLat, stepLon = sp * dLon;
      for (let lat = latA + stepLat * 0.5; lat < latB; lat += stepLat) {
        const j = (rand() - 0.5) * 0.3 * stepLat;
        R('', 'residential', [[lat + j, lonA], [lat + j + (rand() - 0.5) * 0.2 * stepLat, (lonA + lonB) / 2], [lat + j, lonB]]);
      }
      for (let lon = lonA + stepLon * 0.5; lon < lonB; lon += stepLon) {
        const j = (rand() - 0.5) * 0.3 * stepLon;
        R('', 'residential', [[latA, lon + j], [(latA + latB) / 2, lon + j + (rand() - 0.5) * 0.2 * stepLon], [latB, lon + j]]);
      }
      gi++;
    }

    /* --------------------------- Water & green ------------------------- */
    // Duhok Dam lake — fills the valley north of the dam wall
    const waters = [path([
      [36.8768, 43.0010], [36.8790, 43.0000], [36.8820, 43.0010],
      [36.8855, 43.0040], [36.8885, 43.0080], [36.8900, 43.0130],
      [36.8890, 43.0180], [36.8860, 43.0190], [36.8830, 43.0160],
      [36.8800, 43.0130], [36.8778, 43.0080], [36.8765, 43.0045],
    ])];
    // Duhok river — flows from the dam through the city and west down the valley
    const rivers = [path([
      [36.8760, 43.0030], [36.8720, 43.0000], [36.8670, 42.9970],
      [36.8635, 42.9945], [36.8605, 42.9900], [36.8585, 42.9800],
      [36.8570, 42.9660], [36.8555, 42.9460], [36.8535, 42.9250],
      [36.8520, 42.9050],
    ])];
    const greens = [
      // Azadi Park
      path([[36.8460, 42.9930], [36.8505, 42.9935], [36.8510, 43.0000],
            [36.8465, 43.0010], [36.8450, 42.9970]]),
      // University of Duhok campus green
      path([[36.8600, 42.9845], [36.8636, 42.9850], [36.8640, 42.9892],
            [36.8604, 42.9890]]),
      // Dam-side picnic slopes
      path([[36.8740, 43.0050], [36.8770, 43.0090], [36.8760, 43.0130],
            [36.8720, 43.0100]]),
    ];

    // well-known Duhok neighbourhoods (approximate centres)
    const places = [
      ['Nizarke', 36.8640, 42.9470], ['Shindokha', 36.8712, 42.9650],
      ['Masike', 36.8655, 42.9855], ['Baroshke', 36.8548, 42.9800],
      ['Malta', 36.8485, 43.0000], ['KRO', 36.8660, 43.0070],
      ['City Centre (Bazaar)', 36.8585, 42.9930],
    ].map(([name, lat, lon]) => {
      const p = OSM.project(lat, lon);
      return { name, x: p.x, z: p.z, kind: 'suburb' };
    });

    // traffic signals at the main artery junctions
    const signals = [
      [36.8695, 43.0000],   // KRO / Dam road
      [36.8680, 43.0250],   // east roundabout junction
      [36.8585, 42.9930],   // bazaar
      [36.8640, 42.9370],   // KRO west end
      [36.8568, 42.9650],   // Zakho way / Qazi Muhammad
      [36.8585, 42.9860],   // 11 Aylul / University street
      [36.8688, 43.0150],   // KRO east
      [36.8520, 42.9958],   // stadium junction
    ].map(([lat, lon]) => {
      const p = OSM.project(lat, lon);
      return { x: p.x, z: p.z };
    });

    return {
      source: 'offline',
      attribution: 'Offline approximation — connect to the internet for the real OpenStreetMap layout',
      procedural: true,
      roads, waters, greens, rivers, places, signals,
      buildings: [],
    };
  }

  return { build };
})();

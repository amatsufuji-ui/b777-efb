// skewt.js — 2026-11-12 v5.4 (A4 portrait, ETO only, larger labels, no blank pages)
// skewt.js — self-contained Skew-T / hodograph rendering for the 7PT PWA.
//
// No external dependencies. Fetches GFS pressure-level profiles from the
// Open-Meteo forecast API, computes the Tropical-Tidbits-style indices
// block in pure JS, and draws the custom Skew-T page (temperature /
// dewpoint / wet-bulb, wind barbs, purple flight-level lines with labels
// at the left inside edge of the plot; a detailed hodograph, <=5,000 ft
// with height labels in thousands of feet, on the departure and arrival
// pages only) on canvas.
//
// A "profile" is a plain object with aligned arrays, surface first
// (pressure descending):
//   { p: [hPa...], t: [degC...], td: [degC...],
//     u: [kt...], v: [kt...], z: [m...] }
//
// Page renderers: renderWaypointPagePortrait (A4 portrait, ETO panel
// only — the current app layout) and renderWaypointPage (the earlier
// A4-landscape 3-panel page, kept for reference).
//
// Conventions match the Python/MetPy trial generator
// (~/workspace/skew-t-trial/skewt_from_navlog.py): wind speeds in knots,
// PWAT in inches, FL lines from the profile's own geopotential heights.

export const LEVELS_HPA = [1000, 975, 950, 925, 900, 850, 800, 700, 600,
  500, 400, 300, 250, 200, 150, 100];
const PROFILE_VARS = ['temperature', 'relative_humidity', 'wind_speed',
  'wind_direction', 'geopotential_height'];
const API_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_API_URL = 'https://historical-forecast-api.open-meteo.com/v1/forecast';

export const FLIGHT_LEVELS = [100, 180, 240, 300, 340, 400];
export const FL_COLOR = '#7B1FA2'; // strong purple, as in the Python v3/v4
const HODO_MAX_AGL_M = 1524.0;     // hodographs show only <= 5,000 ft AGL
const HODO_LAYERS = [              // (bottom km AGL, top km AGL, colour)
  [0.0, 1.0, '#d62728'],           // red          0-1 km
  [1.0, 3.0, '#e6550d'],           // orange-red   1-3 km (to 5,000 ft)
  [3.0, 6.0, '#2ca02c'],           // green        (unused below 5,000 ft)
  [6.0, 9.0, '#9467bd'],           // purple       (unused below 5,000 ft)
  [9.0, null, '#1f77b4'],          // blue         (unused below 5,000 ft)
];
const HODO_LABEL_HEIGHTS_FT = [1000, 2000, 3000, 4000, 5000];
// ALL hodographs: heights labelled in thousands of feet ("1".."5"),
// nothing above 5,000 ft (hodographData truncates there). No full-digit
// height labels anywhere (v4 audit: a legacy small-hodograph path used
// to print "3000"/"6000"/"9000"/"10000" — removed).
const FT_TO_KM = 0.0003048;  // hodograph height annotations are in feet
const KT_TO_MS = 0.514444;

// ---------------------------------------------------------------------------
// Small numeric helpers
// ---------------------------------------------------------------------------

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

/** Linear interpolation of ys(xs) at x; xs must be ascending. */
function interp(x, xs, ys) {
  if (!xs.length) return NaN;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid; else hi = mid;
  }
  const f = (x - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + f * (ys[hi] - ys[lo]);
}

/** Format a Date (UTC) the way Open-Meteo keys its hourly arrays. */
export function hourKey(date) {
  return date.toISOString().slice(0, 13) + ':00'; // "2026-11-02T23:00"
}

// ---------------------------------------------------------------------------
// Thermodynamics (Magnus / Bolton formulations, as used by MetPy)
// ---------------------------------------------------------------------------

/** Saturation vapour pressure (hPa) at T (degC), Bolton formula. */
function esat(T) {
  return 6.112 * Math.exp((17.67 * T) / (T + 243.5));
}

/** Dewpoint (degC) from temperature (degC) and relative humidity (%). */
function dewpointFromRH(T, rhPct) {
  const e = (clamp(rhPct, 0.1, 100) / 100) * esat(T);
  const ln = Math.log(e / 6.112);
  return (243.5 * ln) / (17.67 - ln);
}

/** Relative humidity (%) from temperature and dewpoint (degC). */
function rhFromTd(T, Td) {
  return clamp(100 * esat(Td) / esat(T), 0, 100);
}

/** Mixing ratio (kg/kg) from dewpoint (degC) and pressure (hPa). */
function mixingRatio(Td, p) {
  const e = esat(Td);
  return 0.622 * e / Math.max(p - e, 1.0);
}

/** Saturation mixing ratio (kg/kg) at temperature (degC), pressure (hPa). */
function satMixingRatio(T, p) {
  const e = esat(T);
  return 0.622 * e / Math.max(p - e, 1.0);
}

/** LCL temperature (K), Bolton (1980). T, Td in degC. */
function lclTemperatureK(T, Td) {
  const TK = T + 273.15, TdK = Td + 273.15;
  return 1 / (1 / (TdK - 56) + Math.log(TK / TdK) / 800) + 56;
}

/**
 * Equivalent potential temperature (K), Bolton (1980).
 * T, Td in degC, p in hPa.
 */
function thetaE(T, Td, p) {
  const TK = T + 273.15;
  const rl = 1000 * mixingRatio(Td, p); // g/kg
  const Tlcl = lclTemperatureK(T, Td);
  return TK * Math.pow(1000 / p, 0.2854 * (1 - 0.00028 * rl)) *
    Math.exp((3.376 / Tlcl - 0.00254) * rl * (1 + 0.00081 * rl));
}

/** Saturated theta-e (K) at temperature T (degC) and pressure p (hPa). */
function satThetaE(T, p) {
  return thetaE(T, T, p);
}

/**
 * Parcel temperature (degC) at pressure p for a parcel that left
 * (p0, T0, Td0): dry-adiabatic below the LCL, pseudoadiabatic above
 * (theta-e conserved, solved by bisection).
 */
function parcelTempAt(p, p0, T0, Td0, pLcl, thetaE0) {
  if (p >= pLcl) {
    // dry adiabatic: T = T0 * (p/p0)^(Rd/cp)
    return (T0 + 273.15) * Math.pow(p / p0, 0.2857) - 273.15;
  }
  let lo = -100, hi = T0 + 5; // degC bracket for the saturated solution
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi);
    if (satThetaE(mid, p) < thetaE0) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

/** Wet-bulb temperature (degC) approximation after Stull (2011). */
function wetBulbStull(T, Td) {
  const rh = rhFromTd(T, Td);
  return T * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(T + rh) - Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
}

// ---------------------------------------------------------------------------
// Data fetching (Open-Meteo GFS)
// ---------------------------------------------------------------------------

/**
 * Convert an Open-Meteo API response JSON into profiles keyed by ISO hour
 * ("2026-11-02T23:00"). Exported for testing / reuse.
 */
export function profilesFromApiResponse(json) {
  const hourly = json && json.hourly;
  const out = {};
  if (!hourly || !Array.isArray(hourly.time)) return out;
  for (let i = 0; i < hourly.time.length; i++) {
    const p = [], t = [], td = [], u = [], v = [], z = [];
    let complete = true;
    for (const lev of LEVELS_HPA) {
      const T = (hourly[`temperature_${lev}hPa`] || [])[i];
      const RH = (hourly[`relative_humidity_${lev}hPa`] || [])[i];
      const WS = (hourly[`wind_speed_${lev}hPa`] || [])[i];
      const WD = (hourly[`wind_direction_${lev}hPa`] || [])[i];
      const GH = (hourly[`geopotential_height_${lev}hPa`] || [])[i];
      if ([T, RH, WS, WD, GH].some(x => x === null || x === undefined ||
          Number.isNaN(Number(x)))) { complete = false; break; }
      const wdirRad = Number(WD) * Math.PI / 180;
      const spd = Number(WS); // knots (wind_speed_unit=kn requested)
      p.push(lev);
      t.push(Number(T));
      td.push(dewpointFromRH(Number(T), Number(RH)));
      u.push(-spd * Math.sin(wdirRad));
      v.push(-spd * Math.cos(wdirRad));
      z.push(Number(GH));
    }
    if (complete && p.length >= 6) out[hourly.time[i]] = { p, t, td, u, v, z };
  }
  return out;
}

/** One day of hourly data from one Open-Meteo endpoint (throws on failure). */
async function fetchOneDay(baseUrl, lat, lon, dayISO, vars) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: dayISO,
    end_date: dayISO,
    hourly: vars.join(','),
    models: 'gfs_seamless',
    timezone: 'GMT',
    wind_speed_unit: 'kn',
  });
  const resp = await fetch(`${baseUrl}?${params.toString()}`);
  if (!resp.ok) throw new Error(`Open-Meteo fetch failed: HTTP ${resp.status}`);
  const json = await resp.json();
  if (!json.hourly || !Array.isArray(json.hourly.time)) {
    throw new Error('Open-Meteo fetch failed: no hourly data');
  }
  return json.hourly;
}

/**
 * Fetch hourly GFS profiles for one location between two instants.
 * startISO / endISO may be Date objects or ISO strings.
 * Returns { "YYYY-MM-DDTHH:00": profile, ... } (keys in GMT).
 *
 * Endpoint routing mirrors the proven Python generator: each UTC day is
 * requested separately — days before today (UTC) come from the Historical
 * Forecast API (the archive of the forecast that was actually issued),
 * today and future days from the regular forecast API. If a day's primary
 * endpoint fails, the other endpoint is tried once before giving up.
 */
export async function fetchProfiles(lat, lon, startISO, endISO) {
  const start = new Date(startISO), end = new Date(endISO);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error('fetchProfiles: invalid start/end');
  }
  const vars = [];
  for (const base of PROFILE_VARS) {
    for (const lev of LEVELS_HPA) vars.push(`${base}_${lev}hPa`);
  }

  const DAY_MS = 86400000;
  const dayStart = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const firstDay = dayStart(start), lastDay = dayStart(end);
  const todayMs = dayStart(new Date());

  // Wide windows keep the legacy single-request behaviour.
  if (lastDay - firstDay > 31 * DAY_MS) {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      hourly: vars.join(','),
      models: 'gfs_seamless',
      timezone: 'GMT',
      wind_speed_unit: 'kn',
    });
    const resp = await fetch(`${API_URL}?${params.toString()}`);
    if (!resp.ok) throw new Error(`Open-Meteo fetch failed: HTTP ${resp.status}`);
    const json = await resp.json();
    if (!json.hourly) throw new Error('Open-Meteo fetch failed: no hourly data');
    return profilesFromApiResponse(json);
  }

  const merged = { time: [] };
  for (const v of vars) merged[v] = [];
  for (let day = firstDay; day <= lastDay; day += DAY_MS) {
    const dayISO = new Date(day).toISOString().slice(0, 10);
    const primary = day < todayMs ? ARCHIVE_API_URL : API_URL;
    const fallback = day < todayMs ? API_URL : ARCHIVE_API_URL;
    let hourly = null, lastErr = null;
    for (const baseUrl of [primary, fallback]) {
      try {
        hourly = await fetchOneDay(baseUrl, lat, lon, dayISO, vars);
        break;
      } catch (err) { lastErr = err; }
    }
    if (!hourly) throw lastErr || new Error('Open-Meteo fetch failed');
    merged.time.push(...hourly.time);
    for (const v of vars) merged[v].push(...(hourly[v] || []));
  }
  return profilesFromApiResponse({ hourly: merged });
}

// ---------------------------------------------------------------------------
// Flight-level pressures
// ---------------------------------------------------------------------------

/** ISA standard pressure (hPa) at height h (m). */
function isaPressure(h) {
  if (h < 11000) return 1013.25 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
  return 226.32 * Math.exp(-(h - 11000) / 6341.6);
}

/**
 * Pressure (hPa) at which each flight level occurs in this profile,
 * interpolating log(p) against the profile's geopotential height
 * (target height = FL x 100 ft in metres); ISA fallback outside range.
 * Returns { 100: hPa, 180: hPa, 240: hPa, 300: hPa, 340: hPa, 400: hPa }.
 */
export function flPressures(profile) {
  const idx = profile.p.map((_, i) => i)
    .sort((a, b) => profile.z[a] - profile.z[b]);
  const zs = idx.map(i => profile.z[i]);
  const lnps = idx.map(i => Math.log(profile.p[i]));
  const out = {};
  for (const fl of FLIGHT_LEVELS) {
    const target = fl * 30.48; // FL x 100 ft -> m
    out[fl] = (target >= zs[0] && target <= zs[zs.length - 1])
      ? Math.exp(interp(target, zs, lnps))
      : isaPressure(target);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Indices (pure-JS approximations of the MetPy calculations used in Python)
// ---------------------------------------------------------------------------

/** Height-ascending view of a profile: [{z, u, v, p, t, td}] (u, v in kt). */
function byHeight(profile) {
  return profile.p.map((p, i) => ({
    p, t: profile.t[i], td: profile.td[i],
    u: profile.u[i], v: profile.v[i], z: profile.z[i],
  })).sort((a, b) => a.z - b.z);
}

/** Mean (u, v) in m/s over an AGL layer [zLo, zHi] (m), 50 m trapezoid grid. */
function layerMeanWindMs(rows, zLo, zHi) {
  const z0 = rows[0].z;
  const zs = rows.map(r => r.z - z0);
  const us = rows.map(r => r.u * KT_TO_MS);
  const vs = rows.map(r => r.v * KT_TO_MS);
  const top = Math.min(zHi, zs[zs.length - 1]);
  if (top <= zLo) return { u: us[0], v: vs[0] };
  let su = 0, sv = 0, n = 0;
  for (let h = zLo; h <= top; h += 50) {
    su += interp(h, zs, us); sv += interp(h, zs, vs); n++;
  }
  return { u: su / n, v: sv / n };
}

/**
 * Bunkers et al. (2000) storm motion. Returns { rm, lm, mean } in knots.
 * Mean wind 0-6 km AGL; shear between the 0-0.5 km and 5.5-6 km layer
 * means; deviation magnitude 7.5 m/s perpendicular to the shear vector.
 */
export function bunkersStormMotion(profile) {
  const rows = byHeight(profile);
  const mean = layerMeanWindMs(rows, 0, 6000);
  const low = layerMeanWindMs(rows, 0, 500);
  const high = layerMeanWindMs(rows, 5500, 6000);
  const shx = high.u - low.u, shy = high.v - low.v;
  const shMag = Math.hypot(shx, shy);
  const D = 7.5;
  let ox = 0, oy = 0;
  if (shMag > 0.01) { ox = D * shy / shMag; oy = -D * shx / shMag; }
  const toKt = ({ u, v }) => ({ u: u / KT_TO_MS, v: v / KT_TO_MS });
  return {
    rm: toKt({ u: mean.u + ox, v: mean.v + oy }),
    lm: toKt({ u: mean.u - ox, v: mean.v - oy }),
    mean: toKt(mean),
  };
}

/** Storm-relative helicity (m2/s2) for the 0-depthM AGL layer, RM motion. */
function srhLayer(profile, depthM, rmKt) {
  const rows = byHeight(profile);
  const z0 = rows[0].z;
  const cx = rmKt.u * KT_TO_MS, cy = rmKt.v * KT_TO_MS;
  // Sample points: profile levels inside the layer + interpolated top.
  const pts = [];
  for (const r of rows) {
    const agl = r.z - z0;
    if (agl <= depthM) pts.push({ z: agl, u: r.u * KT_TO_MS, v: r.v * KT_TO_MS });
  }
  const zs = rows.map(r => r.z - z0);
  const topU = interp(depthM, zs, rows.map(r => r.u * KT_TO_MS));
  const topV = interp(depthM, zs, rows.map(r => r.v * KT_TO_MS));
  if (!pts.length || pts[pts.length - 1].z < depthM) {
    pts.push({ z: depthM, u: topU, v: topV });
  }
  let srh = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const um = 0.5 * (a.u + b.u) - cx, vm = 0.5 * (a.v + b.v) - cy;
    srh += vm * (b.u - a.u) - um * (b.v - a.v);
  }
  return srh;
}

/**
 * CAPE / CIN (J/kg) for a parcel starting at (p0, T0, Td0), by parcel
 * ascent on a fine log-pressure grid. Approximation: virtual-temperature
 * buoyancy integrated in ln(p); LFC = first upward crossing of parcel
 * minus environment Tv above the LCL, EL = last crossing above the LFC.
 * CIN is reported as a negative number (MetPy convention).
 */
function parcelCapeCin(profile, p0, T0, Td0) {
  // Environment on the grid: interpolate T / Td linearly in ln(p).
  const lp = profile.p.map(p => Math.log(p));
  const envAt = (p) => {
    const x = Math.log(p);
    // profile.p is descending, so lp is descending: reverse for interp()
    return {
      t: interp(x, [...lp].reverse(), [...profile.t].reverse()),
      td: interp(x, [...lp].reverse(), [...profile.td].reverse()),
    };
  };
  const Tlcl = lclTemperatureK(T0, Td0);
  const pLcl = p0 * Math.pow(Tlcl / (T0 + 273.15), 3.5);
  const thE = thetaE(T0, Td0, p0);
  const r0 = mixingRatio(Td0, p0);
  const Rd = 287.05;

  const grid = [];
  for (let p = p0; p > 100; p *= 0.985) grid.push(p);
  grid.push(100);
  const diffs = grid.map(p => {
    const env = envAt(p);
    const rEnv = mixingRatio(env.td, p);
    const TvEnv = (env.t + 273.15) * (1 + 0.61 * rEnv) / (1 + rEnv);
    const Tp = parcelTempAt(p, p0, T0, Td0, pLcl, thE);
    const rPar = p >= pLcl ? r0 : satMixingRatio(Tp, p);
    const TvPar = (Tp + 273.15) * (1 + 0.61 * rPar) / (1 + rPar);
    return { p, buoy: Rd * (TvPar - TvEnv) / TvEnv }; // per unit ln(p)
  });

  // Segment contributions (ln p decreases upward; use positive widths).
  const seg = [];
  for (let i = 0; i + 1 < diffs.length; i++) {
    const width = Math.log(diffs[i].p) - Math.log(diffs[i + 1].p);
    seg.push(0.5 * (diffs[i].buoy + diffs[i + 1].buoy) * width);
  }
  let lfc = -1, el = -1;
  for (let i = 0; i + 1 < diffs.length; i++) {
    if (diffs[i + 1].p > pLcl) continue; // crossing must be above the LCL
    if (lfc < 0 && diffs[i].buoy <= 0 && diffs[i + 1].buoy > 0) lfc = i + 1;
    if (lfc >= 0 && diffs[i].buoy > 0 && diffs[i + 1].buoy <= 0) el = i + 1;
  }
  let cape = 0, cin = 0;
  if (lfc < 0) {
    for (const s of seg) if (s < 0) cin += s;
    return { cape: 0, cin };
  }
  const elIdx = el > lfc ? el : diffs.length - 1;
  for (let i = 0; i < seg.length; i++) {
    if (i < lfc) { if (seg[i] < 0) cin += seg[i]; }
    else if (i < elIdx && seg[i] > 0) cape += seg[i];
  }
  return { cape, cin };
}

/**
 * Compute the full indices block for a profile.
 * Returns { srh3000ft, srh10000ft, sbcape, mlcape, mucape, sbcin,
 *           mlcin, shr, pwatIn } — any value may be NaN if not
 * computable. SRH layers are 0-3,000 ft (914.4 m) and 0-10,000 ft
 * (3,048 m) AGL, storm motion = Bunkers right-mover.
 */
export function computeIndices(profile) {
  const out = { srh3000ft: NaN, srh10000ft: NaN, sbcape: NaN, mlcape: NaN,
    mucape: NaN, sbcin: NaN, mlcin: NaN, shr: NaN, pwatIn: NaN };
  try {
    // PWAT: trapezoid integral of mixing ratio (from Td) over pressure.
    let mm = 0;
    for (let i = 0; i + 1 < profile.p.length; i++) {
      const rMean = 0.5 * (mixingRatio(profile.td[i], profile.p[i]) +
        mixingRatio(profile.td[i + 1], profile.p[i + 1]));
      mm += rMean * (profile.p[i] - profile.p[i + 1]) * 100 / 9.80665;
    }
    out.pwatIn = mm / 25.4;
  } catch (e) { /* leave NaN */ }
  try {
    const { rm } = bunkersStormMotion(profile);
    out.srh3000ft = srhLayer(profile, 914.4, rm);   // 0-3,000 ft AGL
    out.srh10000ft = srhLayer(profile, 3048, rm);   // 0-10,000 ft AGL
  } catch (e) { /* leave NaN */ }
  try {
    // SHR 200-850 hPa: bulk shear magnitude (kt), linear in p like MetPy.
    const pAsc = [...profile.p].reverse();
    const uAt = interp(200, pAsc, [...profile.u].reverse()) -
      interp(850, pAsc, [...profile.u].reverse());
    const vAt = interp(200, pAsc, [...profile.v].reverse()) -
      interp(850, pAsc, [...profile.v].reverse());
    out.shr = Math.hypot(uAt, vAt);
  } catch (e) { /* leave NaN */ }
  try {
    const sb = parcelCapeCin(profile, profile.p[0], profile.t[0],
      profile.td[0]);
    out.sbcape = sb.cape; out.sbcin = sb.cin;
  } catch (e) { /* leave NaN */ }
  try {
    // Mixed-layer parcel: simple mean of T / Td over the lowest 100 hPa.
    const pSfc = profile.p[0];
    const layer = profile.p.map((p, i) => i).filter(i => profile.p[i] >= pSfc - 100);
    const tMl = layer.reduce((s, i) => s + profile.t[i], 0) / layer.length;
    const tdMl = layer.reduce((s, i) => s + profile.td[i], 0) / layer.length;
    const ml = parcelCapeCin(profile, pSfc, tMl, tdMl);
    out.mlcape = ml.cape; out.mlcin = ml.cin;
  } catch (e) { /* leave NaN */ }
  try {
    // Most-unstable parcel: level with maximum theta-e.
    let best = 0, bestTh = -Infinity;
    for (let i = 0; i < profile.p.length; i++) {
      const th = thetaE(profile.t[i], profile.td[i], profile.p[i]);
      if (th > bestTh) { bestTh = th; best = i; }
    }
    out.mucape = parcelCapeCin(profile, profile.p[best], profile.t[best],
      profile.td[best]).cape;
  } catch (e) { /* leave NaN */ }
  return out;
}

/**
 * The indices text block, formatted exactly like the Python version
 * (fixed-width values, "n/a" when a value is not computable).
 */
export function indicesText(profile) {
  const idx = computeIndices(profile);
  const f = (x) => Number.isFinite(x) ? x.toFixed(0).padStart(6) : '   n/a';
  const lines = [
    `SRH 0-3000ft:  ${f(idx.srh3000ft)} m2/s2`,
    `SRH 0-10000ft: ${f(idx.srh10000ft)} m2/s2`,
    `SBCAPE:        ${f(idx.sbcape)} J/kg`,
    `MLCAPE:        ${f(idx.mlcape)} J/kg`,
    `MUCAPE:        ${f(idx.mucape)} J/kg`,
    `SBCIN:         ${f(idx.sbcin)} J/kg`,
    `MLCIN:         ${f(idx.mlcin)} J/kg`,
    `SHR 200-850:   ${f(idx.shr)} kt`,
    `PWAT:          ${Number.isFinite(idx.pwatIn) ? idx.pwatIn.toFixed(2).padStart(6) : '   n/a'} in`,
  ];
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Canvas rendering
// ---------------------------------------------------------------------------

/** Draw one wind barb at (x, y). spd in kt, wdir = direction FROM (deg). */
function drawBarb(ctx, x, y, spd, wdirDeg) {
  ctx.save();
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#000';
  ctx.lineWidth = 1.4;
  if (!Number.isFinite(spd) || spd < 2.5) { // calm: small circle
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore(); return;
  }
  const dirRad = wdirDeg * Math.PI / 180;
  const fx = Math.sin(dirRad), fy = -Math.cos(dirRad); // screen "from" unit
  const L = 30;
  const ex = x + fx * L, ey = y + fy * L; // shaft outer end
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  // Feather direction: angled back from the shaft (cosmetic convention).
  const featherLen = 10;
  const back = Math.atan2(-fy, -fx) + (fx >= 0 ? -1 : 1) * 1.05;
  const fdx = Math.cos(back), fdy = Math.sin(back);
  let total = Math.round(spd / 5) * 5;
  const pennants = Math.floor(total / 50); total -= pennants * 50;
  const longs = Math.floor(total / 10); total -= longs * 10;
  const shorts = total >= 5 ? 1 : 0;
  let d = 0; // distance from outer end, stepping toward the station
  const step = 5.2;
  for (let i = 0; i < pennants; i++) {
    const bx = ex - fx * d, by = ey - fy * d;
    const tx = bx - fx * step * 1.6, ty = by - fy * step * 1.6;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + fdx * featherLen * 1.15, by + fdy * featherLen * 1.15);
    ctx.lineTo(tx, ty);
    ctx.closePath(); ctx.fill();
    d += step * 1.6 + 1.5;
  }
  for (let i = 0; i < longs; i++) {
    const bx = ex - fx * d, by = ey - fy * d;
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.lineTo(bx + fdx * featherLen, by + fdy * featherLen); ctx.stroke();
    d += step;
  }
  for (let i = 0; i < shorts; i++) {
    const bx = ex - fx * d, by = ey - fy * d;
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.lineTo(bx + fdx * featherLen * 0.55, by + fdy * featherLen * 0.55);
    ctx.stroke();
    d += step;
  }
  ctx.restore();
}

/**
 * Draw one Skew-T panel into the given canvas (the canvas is filled).
 * opts: { title, validLabel }. profile may be null -> "No data" panel.
 * Layout mirrors the Python design: skewed isotherms, dry adiabats
 * (theta lines), moist adiabats (theta-e lines, approximate), mixing
 * ratio lines, T red / Td green / Tw blue, barb column on the right,
 * purple FL lines with labels at the LEFT inside edge of the plot
 * (white-backed, clear of the barb column on the right).
 */
export function drawSkewTPanel(canvas, profile, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

  // Left margin fits the 21 px pressure numerals (drawn right-aligned
  // at x0-8, so "1000" needs ~55 px); bottom margin fits the 23 px
  // temperature scale plus the 18 px "Temperature (°C)" caption.
  const mL = 78, mT = 56, mB = 64;
  // Right margin: a small gap (flStrip) then the wind-barb column.
  // The barb anchor sits far enough right that a shaft (30 px) pointing
  // back toward the plot never crosses the plot border, and feathers
  // pointing outward never clip at the canvas edge.
  const flStrip = 18, barbCol = 74;
  const x0 = mL, x1 = W - flStrip - barbCol;
  const y0 = mT, y1 = H - mB;
  const pw = x1 - x0, ph = y1 - y0;
  // Pressure decreases upward (log scale): 100 hPa at the top (y0),
  // 1050 hPa at the bottom (y1). Screen y grows downward, so
  // yPix(1000) > yPix(500) > yPix(100).
  const lnBot = Math.log(1050), lnTop = Math.log(100);
  const yPix = (p) => y0 + (Math.log(p) - lnTop) / (lnBot - lnTop) * ph;
  const skew = 0.62 * pw / ph; // horizontal shift per vertical pixel
  const xPix = (T, p) => x0 + ((T + 40) / 85) * pw + skew * (y1 - yPix(p));

  ctx.save();
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, pw, ph);
  ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip();

  // Isotherms (skewed) every 10 degC
  ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = 0.7;
  ctx.fillStyle = '#555'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
  for (let T = -80; T <= 40; T += 10) {
    ctx.beginPath();
    ctx.moveTo(xPix(T, 1050), yPix(1050));
    ctx.lineTo(xPix(T, 100), yPix(100));
    ctx.stroke();
  }
  // Dry adiabats: theta = const (light salmon)
  ctx.strokeStyle = 'rgba(230,120,110,0.55)';
  for (let th = 210; th <= 350; th += 10) {
    ctx.beginPath();
    let started = false;
    for (let p = 1050; p >= 100; p -= 12) {
      const T = th * Math.pow(p / 1000, 0.2857) - 273.15;
      const X = xPix(T, p), Y = yPix(p);
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
  // Moist adiabats: theta-e = const (light blue dashed, approximate)
  ctx.strokeStyle = 'rgba(90,110,230,0.5)';
  ctx.setLineDash([5, 4]);
  for (let twC = -20; twC <= 36; twC += 4) {
    const thE = satThetaE(twC, 1000);
    ctx.beginPath();
    let started = false;
    for (let p = 1000; p >= 100; p -= 15) {
      let lo = -100, hi = 45;
      for (let i = 0; i < 28; i++) {
        const mid = 0.5 * (lo + hi);
        if (satThetaE(mid, p) < thE) lo = mid; else hi = mid;
      }
      const T = 0.5 * (lo + hi);
      const X = xPix(T, p), Y = yPix(p);
      if (X < x0 - 60 || X > x1 + 60) { started = false; continue; }
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Mixing-ratio lines (green dotted), lower troposphere only
  ctx.strokeStyle = 'rgba(30,160,60,0.6)';
  ctx.setLineDash([2, 3]);
  for (const w of [1, 2, 4, 6, 8, 10, 13, 16, 20, 24, 30, 36]) {
    ctx.beginPath();
    let started = false;
    for (let p = 1000; p >= 600; p -= 10) {
      const e = (w / (w + 622)) * p; // hPa
      const lnE = Math.log(e / 6.112);
      const Td = (243.5 * lnE) / (17.67 - lnE);
      const X = xPix(Td, p), Y = yPix(p);
      if (X < x0 || X > x1) { started = false; continue; }
      if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Isobars. (The left pressure labels are drawn AFTER the clip is
  // released, below — numerals sitting left of the plot border would
  // be clipped away entirely if drawn here, inside the plot clip.
  // The bottom temperature scale is post-clip for the same reason.)
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 0.7;
  for (const p of LEVELS_HPA) {
    const Y = yPix(p);
    ctx.beginPath(); ctx.moveTo(x0, Y); ctx.lineTo(x1, Y); ctx.stroke();
  }

  if (profile) {
    // FL lines first (under the sounding curves), labels drawn later.
    const fls = flPressures(profile);
    ctx.strokeStyle = FL_COLOR; ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 4]); ctx.globalAlpha = 0.9;
    for (const fl of FLIGHT_LEVELS) {
      const pFl = fls[fl];
      if (pFl >= 100 && pFl <= 1050) {
        const Y = yPix(pFl);
        ctx.beginPath(); ctx.moveTo(x0, Y); ctx.lineTo(x1, Y); ctx.stroke();
      }
    }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    // Sounding curves
    const plotCurve = (vals, color, lw) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < profile.p.length; i++) {
        const X = xPix(vals[i], profile.p[i]), Y = yPix(profile.p[i]);
        if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    };
    plotCurve(profile.t, '#e00', 2.2);
    plotCurve(profile.td, '#0a0', 2.2);
    plotCurve(profile.t.map((T, i) => wetBulbStull(T, profile.td[i])),
      '#24c', 1.2);
    ctx.restore(); // unclip for barbs / FL labels
    // Wind barbs: one per profile level, anchored in their own column
    // just OUTSIDE the plot's right border (MetPy style).
    for (let i = 0; i < profile.p.length; i++) {
      const spd = Math.hypot(profile.u[i], profile.v[i]);
      const wdir = (Math.atan2(-profile.u[i], -profile.v[i]) * 180 / Math.PI + 360) % 360;
      drawBarb(ctx, x1 + flStrip + 14, yPix(profile.p[i]), spd, wdir);
    }
    // FL labels: LEFT inside edge of the plot, on a semi-transparent
    // white box so gridlines / curves cannot obscure them (and well
    // clear of the wind barbs on the right). Font is 26 px (doubled
    // in v5.4 at the user's request); the white backing box scales
    // with the measured text.
    ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'left';
    for (const fl of FLIGHT_LEVELS) {
      const pFl = fls[fl];
      if (pFl >= 100 && pFl <= 1050) {
        const Y = yPix(pFl);
        const label = `FL${fl}`;
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(x0 + 2, Y - 17, tw + 9, 34);
        ctx.fillStyle = FL_COLOR;
        ctx.fillText(label, x0 + 6, Y + 9);
      }
    }
  } else {
    ctx.restore();
    ctx.fillStyle = '#64748b'; ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data', (x0 + x1) / 2, (y0 + y1) / 2);
  }

  // Pressure-level labels along the left axis: right-aligned numerals
  // just left of the plot border, one per isobar. Drawn here
  // (post-restore) so the clip cannot eat them. The FL labels sit
  // INSIDE the left edge of the plot, so there is no collision.
  ctx.fillStyle = '#333'; ctx.font = '21px sans-serif'; ctx.textAlign = 'right';
  for (const p of LEVELS_HPA) {
    ctx.fillText(String(p), x0 - 8, yPix(p) + 7);
  }

  // Temperature scale along the bottom edge: a small tick on the
  // bottom border and a horizontal °C label just under it, for every
  // isotherm where it crosses the 1000 hPa line within the plot width.
  // Drawn here (post-restore) so the clip cannot eat the labels.
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.fillStyle = '#333'; ctx.font = 'bold 23px sans-serif'; ctx.textAlign = 'center';
  for (let T = -40; T <= 40; T += 10) {
    const X = xPix(T, 1000);
    if (X < x0 || X > x1) continue;
    ctx.beginPath(); ctx.moveTo(X, y1 - 3); ctx.lineTo(X, y1 + 4); ctx.stroke();
    ctx.fillText(String(T), X, y1 + 27);
  }

  // Titles
  ctx.fillStyle = '#111'; ctx.textAlign = 'left';
  ctx.font = '15px sans-serif';
  if (opts.title) ctx.fillText(opts.title, x0, 20);
  if (opts.validLabel) ctx.fillText(opts.validLabel, x0, 40);
  ctx.font = '18px sans-serif'; ctx.fillStyle = '#555';
  ctx.textAlign = 'center';
  ctx.fillText('Temperature (°C)', (x0 + x1) / 2, H - 6);
  return canvas;
}

/** Hodograph sample points truncated at 5,000 ft AGL (mirrors Python). */
function hodographData(profile) {
  const rows = byHeight(profile);
  const z0 = rows[0].z;
  const pts = rows.map(r => ({
    zKm: (r.z - z0) / 1000, u: r.u, v: r.v,
  })).filter(pt => pt.zKm <= HODO_MAX_AGL_M / 1000);
  const topKm = HODO_MAX_AGL_M / 1000;
  if (pts.length && pts[pts.length - 1].zKm < topKm &&
      rows[rows.length - 1].z - z0 > HODO_MAX_AGL_M) {
    const zs = rows.map(r => (r.z - z0) / 1000);
    pts.push({
      zKm: topKm,
      u: interp(topKm, zs, rows.map(r => r.u)),
      v: interp(topKm, zs, rows.map(r => r.v)),
    });
  }
  return pts;
}

/**
 * Draw a hodograph (<=5,000 ft AGL only) into the given canvas.
 * opts.detailed: height-layer colour segments, height labels in
 * thousands of feet ("1".."5" at 1,000..5,000 ft) and Bunkers RM/LM
 * markers (Tropical-Tidbits style, as in the Python version).
 * Otherwise a single red curve with the same "1".."5" (x1000 ft)
 * height labels. Waypoint pages draw only the detailed variant, on
 * the departure / arrival pages.
 */
export function drawHodograph(canvas, profile, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const titleH = 24;
  const size = Math.min(W, H - titleH);
  const cx = W / 2, cy = titleH + size / 2;
  const R = size / 2 - 58; // 60 kt radius (margin fits the 26 px ring numerals)
  const toPx = (u, v) => [cx + (u / 60) * R, cy - (v / 60) * R];

  ctx.strokeStyle = '#999'; ctx.fillStyle = '#666';
  ctx.font = '26px sans-serif'; ctx.lineWidth = 0.8;
  for (let r = 10; r <= 60; r += 10) {
    ctx.beginPath(); ctx.arc(cx, cy, (r / 60) * R, 0, Math.PI * 2);
    ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.beginPath();
  ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
  ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
  ctx.stroke();
  ctx.textAlign = 'center';
  for (let s = -60; s <= 60; s += 20) {
    if (s !== 0) {
      const [tx] = toPx(s, 0); ctx.fillText(String(s), tx, cy + R + 34);
      const [, ty] = toPx(0, s); ctx.fillText(String(s), cx - R - 34, ty + 9);
    }
  }
  ctx.fillStyle = '#111'; ctx.font = '13px sans-serif';
  ctx.fillText('Hodograph (≤5,000 ft, wind in kt, height ×1000 ft)', cx, 16);
  ctx.font = '20px sans-serif'; ctx.fillStyle = '#666';
  ctx.textAlign = 'left';
  ctx.fillText('kt', cx + R + 12, cy + R + 34);

  if (!profile) return canvas;
  const pts = hodographData(profile);
  if (pts.length >= 2) {
    if (opts.detailed) {
      const top = pts[pts.length - 1].zKm;
      for (const [lo, hi, color] of HODO_LAYERS) {
        const hiEff = hi === null ? top : Math.min(hi, top);
        if (hiEff <= lo || lo >= top) continue;
        const segH = [lo,
          ...pts.map(p => p.zKm).filter(h => h > lo && h < hiEff), hiEff];
        ctx.strokeStyle = color; ctx.lineWidth = 2.2;
        ctx.beginPath();
        segH.forEach((h, i) => {
          const zs = pts.map(p => p.zKm);
          const [X, Y] = toPx(interp(h, zs, pts.map(p => p.u)),
            interp(h, zs, pts.map(p => p.v)));
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        });
        ctx.stroke();
      }
      ctx.fillStyle = '#111'; ctx.font = '26px sans-serif';
      ctx.textAlign = 'left';
      const zs = pts.map(p => p.zKm);
      for (const hFt of HODO_LABEL_HEIGHTS_FT) {
        const hk = hFt * FT_TO_KM;
        if (hk <= top + 1e-9) {
          const [X, Y] = toPx(interp(hk, zs, pts.map(p => p.u)),
            interp(hk, zs, pts.map(p => p.v)));
          ctx.fillText(String(hFt / 1000), X + 9, Y - 8);
        }
      }
      try {
        const { rm, lm } = bunkersStormMotion(profile);
        ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        for (const [m, tag] of [[rm, 'RM'], [lm, 'LM']]) {
          const [X, Y] = toPx(m.u, m.v);
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(X, Y, 11, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#000'; ctx.fillText(tag, X, Y + 3.5);
        }
      } catch (e) { /* markers are best-effort */ }
    } else {
      ctx.strokeStyle = '#d62728'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      pts.forEach((pt, i) => {
        const [X, Y] = toPx(pt.u, pt.v);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
      ctx.fillStyle = '#111'; ctx.font = '26px sans-serif';
      ctx.textAlign = 'left';
      const zs = pts.map(p => p.zKm);
      const top = pts[pts.length - 1].zKm;
      for (const hFt of HODO_LABEL_HEIGHTS_FT) {
        const hk = hFt * FT_TO_KM;
        if (hk <= top + 1e-9) {
          const [X, Y] = toPx(interp(hk, zs, pts.map(p => p.u)),
            interp(hk, zs, pts.map(p => p.v)));
          ctx.fillText(String(hFt / 1000), X + 9, Y - 8);
        }
      }
    }
  }
  return canvas;
}

/**
 * Render one full waypoint page (3 Skew-T panels side by side, indices
 * underneath each panel) and return a PNG data URL. Hodographs are
 * drawn only on the detailed pages.
 *
 * wp: { name, lat, lon, header, footer, validLabels: [s0, s1, s2],
 *       panelTitles: [s0, s1, s2] }
 * profiles3: [profileETO, profilePlus6, profilePlus12] (null allowed)
 * opts: { detailed } — departure / arrival pages: each panel also gets
 * a detailed hodograph (<=5,000 ft) beside its indices. Intermediate
 * pages get no hodograph; their indices start at the column's left
 * edge instead.
 */
export function renderWaypointPage(wp, profiles3, opts = {}) {
  if (typeof document === 'undefined') {
    throw new Error('renderWaypointPage requires a DOM (browser) canvas');
  }
  const PW = 2550, PH = 1575;
  const page = document.createElement('canvas');
  page.width = PW; page.height = PH;
  const ctx = page.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PW, PH);

  ctx.fillStyle = '#111'; ctx.textAlign = 'center';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(wp.header || wp.name || '', PW / 2, 62);

  // Line-colour legend (Tropical-Tidbits style), centred in a slim row
  // under the title: a short swatch drawn with the exact stroke that
  // drawSkewTPanel uses, followed by its label. Sounding lines first
  // (Temperature / Dewpoint / Wet-bulb), then the grid references.
  const legendEntries = [
    { color: '#e00', width: 3.2, dash: [], label: 'Temperature' },
    { color: '#0a0', width: 3.2, dash: [], label: 'Dewpoint' },
    { color: '#24c', width: 2.4, dash: [], label: 'Wet-bulb' },
    { color: 'rgba(230,120,110,0.9)', width: 2, dash: [], label: 'Dry Adiabats' },
    { color: 'rgba(90,110,230,0.85)', width: 2, dash: [7, 5], label: 'Moist Adiabats' },
    { color: 'rgba(30,160,60,0.9)', width: 2.6, dash: [2, 3], label: 'Sat. Mix. Ratio' },
  ];
  ctx.font = '24px sans-serif';
  const swatchW = 46, swatchGap = 12, entryGap = 38;
  let legendW = -entryGap;
  for (const e of legendEntries) {
    e.textW = ctx.measureText(e.label).width;
    legendW += swatchW + swatchGap + e.textW + entryGap;
  }
  let lx = (PW - legendW) / 2;
  ctx.textAlign = 'left';
  for (const e of legendEntries) {
    ctx.strokeStyle = e.color; ctx.lineWidth = e.width;
    ctx.setLineDash(e.dash);
    ctx.beginPath(); ctx.moveTo(lx, 84); ctx.lineTo(lx + swatchW, 84); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#111';
    ctx.fillText(e.label, lx + swatchW + swatchGap, 92);
    lx += swatchW + swatchGap + e.textW + entryGap;
  }

  const colW = PW / 3;
  const panelW = Math.floor(colW - 26), panelH = 900;
  const panelY = 106;

  // Compact Japanese-first colour key, one centred line directly
  // under the row of Skew-T panels (on EVERY page) — the line colours
  // spelled out next to the charts themselves, not only in the
  // English header legend above.
  const keyY = panelY + panelH + 30; // text baseline
  const keyEntries = [
    { color: '#e00', width: 3.2, label: '気温 Temperature' },
    { color: '#0a0', width: 3.2, label: '露点 Dewpoint' },
    { color: '#24c', width: 2.4, label: '湿球 Wet-bulb' },
  ];
  ctx.font = '24px sans-serif';
  const kSwatch = 40, kGap = 10, kEntryGap = 44;
  let keyW = -kEntryGap;
  for (const e of keyEntries) {
    e.textW = ctx.measureText(e.label).width;
    keyW += kSwatch + kGap + e.textW + kEntryGap;
  }
  let kx = (PW - keyW) / 2;
  ctx.textAlign = 'left';
  for (const e of keyEntries) {
    ctx.strokeStyle = e.color; ctx.lineWidth = e.width;
    ctx.beginPath(); ctx.moveTo(kx, keyY - 8); ctx.lineTo(kx + kSwatch, keyY - 8); ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.fillText(e.label, kx + kSwatch + kGap, keyY);
    kx += kSwatch + kGap + e.textW + kEntryGap;
  }

  const subY = panelY + panelH + 18 + 40;
  const subH = 415;

  for (let i = 0; i < 3; i++) {
    const x = Math.floor(i * colW + 13);
    const prof = profiles3[i] || null;
    const pc = document.createElement('canvas');
    pc.width = panelW; pc.height = panelH;
    drawSkewTPanel(pc, prof, {
      title: (wp.panelTitles && wp.panelTitles[i]) || '',
      validLabel: (wp.validLabels && wp.validLabels[i]) || '',
    });
    ctx.drawImage(pc, x, panelY);

    // Hodographs only on the detailed (departure / arrival) pages.
    // On intermediate pages the indices reclaim the strip and start
    // at the column's left edge rather than leaving a blank gap
    // where the hodograph would have been.
    let textX = x;
    if (opts.detailed) {
      const hc = document.createElement('canvas');
      hc.width = 470; hc.height = subH;
      drawHodograph(hc, prof, { detailed: true });
      ctx.drawImage(hc, x, subY);
      textX = x + 478;
      // Notation note directly under the hodograph: its height
      // figures are thousands of feet, not feet.
      ctx.fillStyle = '#333'; ctx.textAlign = 'left';
      ctx.font = '20px sans-serif';
      ctx.fillText('高度の数字は×1000 ft（1=1000ft、5=5000ft）', x, subY + subH + 26);
    }

    ctx.fillStyle = '#111'; ctx.textAlign = 'left';
    // 23px monospace: the widest line ("SRH 0-10000ft: ... m2/s2",
    // 27 chars) is ~375 px, so starting at textX it stays inside the
    // 850 px column — at 29px the third column's values ran off the
    // right edge of the page.
    ctx.font = '23px monospace';
    const text = prof ? indicesText(prof) : 'No data';
    text.split('\n').forEach((line, li) => {
      ctx.fillText(line, textX, subY + 40 + li * 38);
    });
  }

  ctx.fillStyle = '#333'; ctx.textAlign = 'center';
  ctx.font = 'italic 25px sans-serif';
  ctx.fillText(wp.footer || '', PW / 2, PH - 28);
  return page.toDataURL('image/png');
}

/**
 * Render one waypoint page in A4 PORTRAIT (1754 x 2480 px) with a
 * single Skew-T panel — the ETO profile only — and return the canvas.
 * Layout, top to bottom: page title, ETO sub-line, the line-colour
 * legend strip (same 6 entries as the landscape page), one large
 * Skew-T panel (drawSkewTPanel: FL labels at the left inside edge,
 * temperature scale under the panel), then the indices block; on
 * the detailed (departure / arrival)
 * pages the detailed hodograph (<=5,000 ft, height labels "1".."5"
 * in thousands of feet) sits beside the indices with its notation
 * caption underneath. Intermediate pages get no hodograph and their
 * indices start at the left edge.
 *
 * canvas: caller-provided canvas (resized to 1754 x 2480 if needed).
 * args: { wp, profile, detailed }
 *   wp: { name, lat, lon, header, subline, panelTitle, validLabel,
 *         footer } — header carries the waypoint name / lat / lon /
 *         cumulative NM, subline the ETO valid time.
 *   profile: the single ETO profile (null -> "No data").
 */
export function renderWaypointPagePortrait(canvas, args = {}) {
  if (typeof document === 'undefined') {
    throw new Error('renderWaypointPagePortrait requires a DOM (browser) canvas');
  }
  const wp = args.wp || {};
  const profile = args.profile || null;
  const PW = 1754, PH = 2480; // A4 portrait at 150 dpi
  if (canvas.width !== PW || canvas.height !== PH) {
    canvas.width = PW; canvas.height = PH;
  }
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PW, PH);

  // Page title + ETO sub-line
  ctx.fillStyle = '#111'; ctx.textAlign = 'center';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText(wp.header || wp.name || '', PW / 2, 66);
  if (wp.subline) {
    ctx.fillStyle = '#333'; ctx.font = '28px sans-serif';
    ctx.fillText(wp.subline, PW / 2, 110);
  }

  // Line-colour legend strip — the same 6 entries as the landscape
  // page, centred under the sub-line.
  const legendEntries = [
    { color: '#e00', width: 3.2, dash: [], label: 'Temperature' },
    { color: '#0a0', width: 3.2, dash: [], label: 'Dewpoint' },
    { color: '#24c', width: 2.4, dash: [], label: 'Wet-bulb' },
    { color: 'rgba(230,120,110,0.9)', width: 2, dash: [], label: 'Dry Adiabats' },
    { color: 'rgba(90,110,230,0.85)', width: 2, dash: [7, 5], label: 'Moist Adiabats' },
    { color: 'rgba(30,160,60,0.9)', width: 2.6, dash: [2, 3], label: 'Sat. Mix. Ratio' },
  ];
  ctx.font = '24px sans-serif';
  const swatchW = 46, swatchGap = 12, entryGap = 30;
  let legendW = -entryGap;
  for (const e of legendEntries) {
    e.textW = ctx.measureText(e.label).width;
    legendW += swatchW + swatchGap + e.textW + entryGap;
  }
  let lx = (PW - legendW) / 2;
  ctx.textAlign = 'left';
  for (const e of legendEntries) {
    ctx.strokeStyle = e.color; ctx.lineWidth = e.width;
    ctx.setLineDash(e.dash);
    ctx.beginPath(); ctx.moveTo(lx, 138); ctx.lineTo(lx + swatchW, 138); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#111';
    ctx.fillText(e.label, lx + swatchW + swatchGap, 146);
    lx += swatchW + swatchGap + e.textW + entryGap;
  }

  // The single, large Skew-T panel (ETO only). The colour key that
  // used to sit under the panel was removed in v5.4 — the header
  // legend strip above already explains the line colours — and the
  // panel grew into the reclaimed space.
  const panelX = 36, panelY = 170;
  const panelW = PW - 72, panelH = 1360;
  const pc = document.createElement('canvas');
  pc.width = panelW; pc.height = panelH;
  drawSkewTPanel(pc, profile, {
    title: wp.panelTitle || '',
    validLabel: wp.validLabel || '',
  });
  ctx.drawImage(pc, panelX, panelY);

  // Bottom strip: indices, with the detailed hodograph beside them
  // on the departure / arrival pages only.
  const stripY = panelY + panelH + 46;
  let textX = panelX;
  if (args.detailed) {
    const hc = document.createElement('canvas');
    hc.width = 680; hc.height = 720;
    drawHodograph(hc, profile, { detailed: true });
    ctx.drawImage(hc, panelX, stripY);
    // Notation note directly under the hodograph: its height
    // figures are thousands of feet, not feet.
    ctx.fillStyle = '#333'; ctx.textAlign = 'left';
    ctx.font = '22px sans-serif';
    ctx.fillText('高度の数字は×1000 ft（1=1000ft、5=5000ft）',
      panelX, stripY + 720 + 34);
    textX = panelX + 680 + 24;
  }

  ctx.fillStyle = '#111'; ctx.textAlign = 'left';
  ctx.font = '25px monospace';
  const text = profile ? indicesText(profile) : 'No data';
  text.split('\n').forEach((line, li) => {
    ctx.fillText(line, textX, stripY + 46 + li * 42);
  });

  // Footer
  ctx.fillStyle = '#333'; ctx.textAlign = 'center';
  ctx.font = 'italic 25px sans-serif';
  ctx.fillText(wp.footer || '', PW / 2, PH - 34);
  return canvas;
}

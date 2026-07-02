import { HOLD_SPD_DATA_RAW, MANEUVER_1_3G_MACH_DATA } from '../data/perfData';


// --- [4-1] Formatting & Parsing ---
export function formatNum(num) { return (num == null || isNaN(num)) ? "---" : Math.round(num).toLocaleString('en-US'); }
export function formatWeightDisplay(val) { return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K'; }
export function parseWeightInput(str) {
  if (!str) return null; str = str.toString().trim().toUpperCase().replace(/,/g, '');
  let mult = 1; if (str.endsWith('K')) { mult = 1000; str = str.slice(0, -1); }
  const val = parseFloat(str); if (isNaN(val)) return null;
  if (mult === 1 && val <= 1500) mult = 1000;
  return Math.round((val * mult) / 1000) * 1000;
}

// --- [4-2] Interpolation ---
export function interpolateObjArray(x, arr, subIndex) {
  if (!arr || arr.length === 0) return null; let s = [...arr].sort((a, b) => a[0] - b[0]);
  if (x <= s[0][0]) return s[0][subIndex]; if (x >= s[s.length - 1][0]) return s[s.length - 1][subIndex];
  for (let i = 0; i < s.length - 1; i++) {
    if (x >= s[i][0] && x <= s[i + 1][0]) {
      const y1 = s[i][subIndex], y2 = s[i + 1][subIndex];
      if (y1 == null || y2 == null) return null;
      return y1 + ((x - s[i][0]) / (s[i + 1][0] - s[i][0])) * (y2 - y1);
    }
  } return null;
}
export function interpolateDirectArray(x, xValues, yValues) {
  if (!xValues || !yValues || xValues.length !== yValues.length) return null;
  if (x <= xValues[0]) return yValues[0]; if (x >= xValues[xValues.length - 1]) return yValues[yValues.length - 1];
  for (let i = 0; i < xValues.length - 1; i++) {
    if (x >= xValues[i] && x <= xValues[i + 1]) {
      const y1 = yValues[i], y2 = yValues[i + 1]; if (y1 == null || y2 == null) return null;
      return y1 + ((x - xValues[i]) / (xValues[i + 1] - xValues[i])) * (y2 - y1);
    }
  } return null;
}

// --- [4-3] Flight Calculation ---
export function kiasToMach(kias, alt) {
  const a0 = 661.4786; let delta = alt <= 36089 ? Math.pow(1 - 0.0000068755856 * alt, 5.2558797) : 0.22336 * Math.exp(-0.00004806346 * (alt - 36089));
  const qc_p0 = Math.pow(1 + 0.2 * Math.pow(kias / a0, 2), 3.5) - 1; return Math.sqrt(5 * (Math.pow(qc_p0 / delta + 1, 2 / 7) - 1));
}
export function getHoldSpeed(type, weight, alt) {
  const d = HOLD_SPD_DATA_RAW[type]; if (!d) return null;
  let wK = Math.max(d.weights[0], Math.min(weight / 1000, d.weights[d.weights.length - 1]));
  let a = Math.max(d.alts[0], Math.min(alt, d.alts[d.alts.length - 1]));
  let wIdx = 0; while (wIdx < d.weights.length - 1 && d.weights[wIdx + 1] <= wK) wIdx++;
  let aIdx = 0; while (aIdx < d.alts.length - 1 && d.alts[aIdx + 1] <= a) aIdx++;
  const w1 = d.weights[wIdx], w2 = d.weights[wIdx + 1] || w1, a1 = d.alts[aIdx], a2 = d.alts[aIdx + 1] || a1;
  const wRatio = w1 === w2 ? 0 : (wK - w1) / (w2 - w1), aRatio = a1 === a2 ? 0 : (a - a1) / (a2 - a1);
  const v11 = d.kias[wIdx][aIdx], v12 = d.kias[wIdx][aIdx + 1] || v11, v21 = d.kias[wIdx + 1]?.[aIdx] || v11, v22 = d.kias[wIdx + 1]?.[aIdx + 1] || v12;
  return Math.round((v11 + (v21 - v11) * wRatio) + ((v12 + (v22 - v12) * wRatio) - (v11 + (v21 - v11) * wRatio)) * aRatio);
}

export function getManeuverMach(type, weight, alt) {
  try {
    const d = MANEUVER_1_3G_MACH_DATA[type]; if (!d) return null;
    let wK = Math.max(d.weights[0], Math.min(weight / 1000, d.weights[d.weights.length - 1]));
    let a = Math.max(d.alts[0], Math.min(alt, d.alts[d.alts.length - 1]));
    let wIdx = 0; while (wIdx < d.weights.length - 1 && d.weights[wIdx + 1] <= wK) wIdx++;
    let aIdx = 0; while (aIdx < d.alts.length - 1 && d.alts[aIdx + 1] <= a) aIdx++;
    const w1 = d.weights[wIdx], w2 = d.weights[wIdx + 1] || w1, a1 = d.alts[aIdx], a2 = d.alts[aIdx + 1] || a1;
    const wRatio = w1 === w2 ? 0 : (wK - w1) / (w2 - w1), aRatio = a1 === a2 ? 0 : (a - a1) / (a2 - a1);

    const row1 = d.mach[wIdx];
    const row2 = d.mach[wIdx + 1] || row1;
    const v11 = row1[aIdx];
    const v12 = row1[aIdx + 1] !== undefined ? row1[aIdx + 1] : v11;
    const v21 = row2[aIdx] !== undefined ? row2[aIdx] : v11;
    const v22 = row2[aIdx + 1] !== undefined ? row2[aIdx + 1] : v12;

    if (v11 === undefined || v12 === undefined || v21 === undefined || v22 === undefined) return null;
    return (v11 + (v21 - v11) * wRatio) + ((v12 + (v22 - v12) * wRatio) - (v11 + (v21 - v11) * wRatio)) * aRatio;
  } catch (e) {
    return null;
  }
}

export const calculateTAS = (ias, elevationFt, oatC) => {
  const iasNum = Number(ias), elevNum = Number(elevationFt), oatNum = Number(oatC);
  if (isNaN(iasNum) || isNaN(elevNum) || isNaN(oatNum) || iasNum === 0) return 0;
  const T0 = 288.15, L = 0.0019812, h = Math.max(0, elevNum), T_act = oatNum + 273.15;
  const P_ratio = Math.pow((1 - (L * h) / T0), 5.25588), sigma = P_ratio * (T0 / T_act);
  return Math.round(iasNum / Math.sqrt(sigma));
};
export const calculateHeadingAndGS = (trackAngleRad, tas, windVx, windVy) => {
  const crossWindComp = windVx * Math.sin(trackAngleRad) - windVy * Math.cos(trackAngleRad);
  const ratio = Math.max(-0.99, Math.min(0.99, crossWindComp / tas)), wca = Math.asin(ratio);
  const headingRad = trackAngleRad + wca;
  const tailWindComp = windVx * Math.cos(trackAngleRad) + windVy * Math.sin(trackAngleRad);
  return { headingRad, gs: Math.max(1, tas * Math.cos(wca) + tailWindComp) };
};
export const generateTurnPoints = (startAngle, endAngle, radiusTAS, tas, windVx, windVy, numPoints = 30) => {
  const points = [], angleDiff = endAngle - startAngle, turnTimeHours = Math.abs(angleDiff) * radiusTAS / tas, isLeftTurn = angleDiff > 0;
  const centerAngle = startAngle + (isLeftTurn ? Math.PI / 2 : -Math.PI / 2), centerX = radiusTAS * Math.cos(centerAngle), centerY = radiusTAS * Math.sin(centerAngle);
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints, currentAngle = startAngle + angleDiff * t, posAngle = currentAngle + (isLeftTurn ? -Math.PI / 2 : Math.PI / 2);
    points.push({ x: centerX + radiusTAS * Math.cos(posAngle) + windVx * (turnTimeHours * t), y: centerY + radiusTAS * Math.sin(posAngle) + windVy * (turnTimeHours * t) });
  } return points;
};

export const calculateWindComponentRow = (rwy, windDir, limitConfig, isCopMode) => {
  const rwyHdg = parseInt(rwy, 10) * 10;
  let angleDiff = Math.abs(windDir - rwyHdg);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;
  const rad = angleDiff * (Math.PI / 180);
  const isTailwind = angleDiff > 90;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const cols = isCopMode ? limitConfig.copCols : limitConfig.capCols;
  const vals = {};
  cols.forEach(col => {
    const crossLimit = parseFloat(col.val);
    const tailLimit = 15;
    let maxWind = Math.floor(crossLimit / sin);
    if (isTailwind) { const tailMaxWind = Math.floor(tailLimit / cos); maxWind = Math.min(maxWind, tailMaxWind); }
    if (maxWind > 99) maxWind = 99;
    if (sin === 0 && !isTailwind) maxWind = 99;
    if (sin === 0 && isTailwind) maxWind = tailLimit;
    const isTailwindLimited = isTailwind && maxWind === Math.floor(tailLimit / cos);
    vals[col.val] = isTailwindLimited ? "_" + maxWind + "_" : String(maxWind);
  });
  return { vals };
};
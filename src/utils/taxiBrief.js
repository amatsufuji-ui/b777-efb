// taxiBrief.js — 2026-11-16 v1.1 (TAXI BRIEFING: FR24 API / FR24 サイト CSV 取込で同便名・同出発地の直近運航の地上タクシー履歴を取得)
// v1.1 追加: FR24 サイト (GOLD) からダウンロードした軌跡 CSV の取込経路。
// parseFr24Csv / briefingFromCsvList / mergeBriefingFlights と、API の airports/full が
// 無くても滑走路判定ができる同梱滑走路テーブル BUNDLED_RUNWAYS (現状 KORD のみ、
// FAA 公開の両端座標)。API 経路 (fetchTaxiBriefing) の挙動は v1.0 から変更なし。
// src/utils/taxiBrief.js として配置する (NavlogView から../utils/taxiBrief で import)。
// 同一オリジンの Pages Function プロキシ (/api/fr24/*, functions/api/fr24/[[path]].js) が
// FR24_API_TOKEN を保持して https://fr24api.flightradar24.com/api/* へ中継する。
// トークン未設定の間はプロキシが 501 を返し、本モジュールは code='UNCONFIGURED' の
// TaxiBriefError を投げる (UI 側で「FR24 APIが未設定です」と表示する)。
// FR24 API の応答フィールド名はエンドポイント/版で表記揺れがあるため、
// normalise* 群で複数候補を吸収する。公式 JS SDK (@flightradar24/fr24sdk) で確認した確定事項:
// - flight-summary のクエリ: flights / airports / flight_datetime_from / flight_datetime_to / limit / sort
// - flight-tracks: GET?flight_id=<fr24_id>、応答は { data: [ { fr24_id, tracks: [point...]}]}
// - 空港 full の SDK パスは /api/static/airports/{code}/full (ドキュメント記載の
// /api/airports/full/{ICAO} を先に試し、404 の場合のみこちらへフォールバックする)
// トラックポイントの主フィールドは lat / lon / alt / gspd / track / timestamp とし、別名も許容する。

const PROXY_BASE = '/api/fr24';
const EARTH_RADIUS_NM = 3440.065;
const GROUND_RADIUS_NM = 6; // 出発空港中心からこの半径を超えた点は地上区間から除く
const LIFTOFF_GS_KT = 100; // 離陸判定: 地上速度しきい値
const LIFTOFF_ALT_AGL_FT = 200; // 離陸判定: 対地高度しきい値 (持続条件つき)
const MOVE_GS_KT = 5; // 「動き始め」判定の地上速度
const MOVE_SUSTAIN_POINTS = 3; // 動き始めは MOVE_GS_KT 以上が連続する点数で判定
const MAX_PLOT_POINTS = 140; // 描画用に間引く上限

export class TaxiBriefError extends Error {
constructor(code, message, status) {
super(message);
this.name = 'TaxiBriefError';
this.code = code; // 'UNCONFIGURED' | 'NETWORK' | 'UPSTREAM' | 'NO_FLIGHTS' | 'BAD_RESPONSE'
this.status = status || null;
}
}

// ---------------------------------------------------------------------------
// 小物ユーティリティ
// ---------------------------------------------------------------------------

const toNum = (v) => {
if (v === null || v === undefined || v === '') return null;
const n = typeof v === 'number'? v: parseFloat(v);
return Number.isFinite(n)? n: null;
};

const pickVal = (obj, keys) => {
if (!obj || typeof obj!== 'object') return null;
for (const k of keys) {
const v = obj[k];
if (v!== null && v!== undefined && v!== '') return v;
}
return null;
};

// コード値がオブジェクト ({icao:'KORD'} 等) で返る場合も文字列に寄せる
const codeStr = (v) => {
if (v === null || v === undefined) return null;
if (typeof v === 'string') return v;
if (typeof v === 'object') {
const c = pickVal(v, ['icao', 'code', 'iata']);
return typeof c === 'string'? c: null;
}
return null;
};

const round1 = (v) => (v === null || v === undefined ||!Number.isFinite(v))? null: Math.round(v * 10) / 10;

const toRad = (deg) => deg * Math.PI / 180;

export const haversineNm = (lat1, lon1, lat2, lon2) => {
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);
const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(a)));
};

export const bearingDeg = (lat1, lon1, lat2, lon2) => {
const dLon = toRad(lon2 - lon1);
const y = Math.sin(dLon) * Math.cos(toRad(lat2));
const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

export const angularDiffDeg = (a, b) => {
const d = Math.abs(((a - b) % 360 + 360) % 360);
return d > 180? 360 - d: d;
};

const median = (values) => {
const v = values.filter((x) => x!== null && x!== undefined && Number.isFinite(x)).slice().sort((a, b) => a - b);
if (v.length === 0) return null;
const mid = Math.floor(v.length / 2);
return v.length % 2 === 1? v[mid]: (v[mid - 1] + v[mid]) / 2;
};

// ---------------------------------------------------------------------------
// FR24 応答の正規化 (フィールド名の表記揺れを吸収する)
// ---------------------------------------------------------------------------

const asArray = (json) => {
if (!json) return [];
if (Array.isArray(json)) return json;
for (const k of ['data', 'result', 'results', 'flights', 'items']) {
if (Array.isArray(json[k])) return json[k];
}
return [];
};

export const normaliseSummaryItem = (item) => {
if (!item || typeof item!== 'object') return null;
const fr24Id = pickVal(item, ['fr24_id', 'fr24Id', 'id', 'flight_id']);
if (!fr24Id) return null;
const takeoffRaw = pickVal(item, ['datetime_takeoff', 'takeoff_datetime', 'datetime_take_off', 'actual_takeoff', 'takeoff_time', 'departure_datetime']);
const takeoffTs = takeoffRaw!== null? (typeof takeoffRaw === 'number'? takeoffRaw: Date.parse(takeoffRaw) / 1000): null;
return {
fr24Id: String(fr24Id),
flightNo: pickVal(item, ['flight_number', 'flight', 'flight_no', 'flightNumber']),
registration: pickVal(item, ['reg', 'registration', 'aircraft_registration', 'aircraft_reg']),
originIcao: codeStr(pickVal(item, ['orig_icao', 'origin_icao', 'orig', 'origin', 'departure_icao', 'from_icao'])),
destIcao: codeStr(pickVal(item, ['dest_icao', 'destination_icao', 'dest', 'destination', 'arrival_icao', 'to_icao'])),
takeoffUtc: takeoffRaw!== null && typeof takeoffRaw === 'string'? takeoffRaw: (Number.isFinite(takeoffTs)? new Date(takeoffTs * 1000).toISOString(): null),
takeoffTs: Number.isFinite(takeoffTs)? takeoffTs: null
};
};

export const normaliseSummaryItems = (json) => asArray(json).map(normaliseSummaryItem).filter(Boolean);

const parseTimestamp = (v) => {
if (v === null || v === undefined) return null;
if (typeof v === 'number') {
if (!Number.isFinite(v)) return null;
return v > 1e12? v / 1000: v; // ms → s
}
const t = Date.parse(v);
return Number.isFinite(t)? t / 1000: null;
};

export const normaliseTrackPoint = (p) => {
if (!p || typeof p!== 'object') return null;
const lat = toNum(pickVal(p, ['lat', 'latitude']));
const lon = toNum(pickVal(p, ['lon', 'lng', 'longitude']));
const ts = parseTimestamp(pickVal(p, ['timestamp', 'ts', 'time', 'datetime', 'epoch']));
if (lat === null || lon === null || ts === null) return null;
return {
lat, lon, ts,
alt: toNum(pickVal(p, ['alt', 'altitude', 'altitude_ft', 'alt_ft'])),
gs: toNum(pickVal(p, ['gspd', 'gs', 'ground_speed', 'groundspeed', 'speed', 'spd'])),
track: toNum(pickVal(p, ['track', 'heading', 'trk', 'course']))
};
};

export const normaliseTrackPoints = (json) => {
if (!json) return [];
let rawPoints = null;
const findIn = (container) => {
if (!container) return null;
if (Array.isArray(container)) {
if (container.length === 0) return [];
if (container[0] && Array.isArray(container[0].tracks)) return container[0].tracks;
if (container[0] && typeof container[0] === 'object' && ('lat' in container[0] || 'latitude' in container[0])) return container;
return null;
}
if (typeof container === 'object') {
if (Array.isArray(container.tracks)) return container.tracks;
if (Array.isArray(container.track)) return container.track;
if (Array.isArray(container.positions)) return container.positions;
}
return null;
};
rawPoints = findIn(json);
if (rawPoints === null && json && typeof json === 'object') {
for (const k of ['data', 'result', 'results']) {
rawPoints = findIn(json[k]);
if (rawPoints!== null) break;
}
}
if (!rawPoints) return [];
return rawPoints.map(normaliseTrackPoint).filter(Boolean).sort((a, b) => a.ts - b.ts);
};

// 空港 full 応答 → { lat, lon, elevationFt, runways: [{name, headingDeg, lat, lon}...]} (滑走路は「端点」単位)
const normaliseRunwayEnds = (item) => {
const ends = [];
if (!item || typeof item!== 'object') return ends;
// FAA 形式 (le_* / he_*)
if (item.le_ident || item.he_ident) {
if (item.le_ident) ends.push({
name: String(item.le_ident),
headingDeg: toNum(pickVal(item, ['le_heading_degT', 'le_heading_deg', 'le_heading'])),
lat: toNum(pickVal(item, ['le_latitude_deg', 'le_lat', 'le_latitude'])),
lon: toNum(pickVal(item, ['le_longitude_deg', 'le_lon', 'le_longitude']))
});
if (item.he_ident) ends.push({
name: String(item.he_ident),
headingDeg: toNum(pickVal(item, ['he_heading_degT', 'he_heading_deg', 'he_heading'])),
lat: toNum(pickVal(item, ['he_latitude_deg', 'he_lat', 'he_latitude'])),
lon: toNum(pickVal(item, ['he_longitude_deg', 'he_lon', 'he_longitude']))
});
return ends;
}
if (Array.isArray(item.ends)) {
item.ends.forEach((e) => ends.push(...normaliseRunwayEnds(e)));
return ends;
}
const name = pickVal(item, ['name', 'ident', 'designator', 'runway', 'id']);
const headingDeg = toNum(pickVal(item, ['heading', 'heading_deg', 'heading_degT', 'true_heading', 'bearing', 'heading_true']));
const lat = toNum(pickVal(item, ['lat', 'latitude', 'threshold_lat', 'center_lat']));
const lon = toNum(pickVal(item, ['lon', 'lng', 'longitude', 'threshold_lon', 'center_lon']));
if (typeof name === 'string' && name.includes('/') && headingDeg!== null) {
const parts = name.split('/').map((s) => s.trim()).filter(Boolean);
if (parts.length === 2) {
ends.push({ name: parts[0], headingDeg, lat, lon});
ends.push({ name: parts[1], headingDeg: (headingDeg + 180) % 360, lat, lon});
return ends;
}
}
if (name) ends.push({ name: String(name), headingDeg, lat, lon});
return ends;
};

export const normaliseAirport = (json) => {
if (!json || typeof json!== 'object') return null;
const root = (json.data && typeof json.data === 'object' &&!Array.isArray(json.data))? json.data
: (json.airport && typeof json.airport === 'object')? json.airport: json;
const lat = toNum(pickVal(root, ['lat', 'latitude']));
const lon = toNum(pickVal(root, ['lon', 'lng', 'longitude']));
let rawRunways = null;
for (const k of ['runways', 'runway', 'runways_info', 'runway_info', 'runway_list']) {
if (Array.isArray(root[k])) { rawRunways = root[k]; break;}
}
const runways = rawRunways? rawRunways.flatMap(normaliseRunwayEnds): [];
return {
lat, lon,
elevationFt: toNum(pickVal(root, ['elevation', 'elevation_ft', 'elev', 'altitude'])),
runways
};
};

// ---------------------------------------------------------------------------
// 地上区間の抽出 (純粋関数)
// points: normaliseTrackPoint 済みの配列 [{lat, lon, alt, gs, track, ts}...]
// options: { centerLat, centerLon, elevationFt}
// 戻り値: { points: [[lat,lon],...], taxiOutMin, waitMin, liftoffHeading,
// liftoffLat, liftoffLon, pathLengthNm, startTs, liftoffTs} / 該当なしは null
// ---------------------------------------------------------------------------

export const extractGroundSegment = (points, options = {}) => {
if (!Array.isArray(points) || points.length < 3) return null;
const pts = points.filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Number.isFinite(p.ts))
.slice().sort((a, b) => a.ts - b.ts);
if (pts.length < 3) return null;

// 対地高度の基準 (空港標高が分かればそれ、無ければ冒頭の最低高度)
let groundRefAlt = Number.isFinite(options.elevationFt)? options.elevationFt: null;
if (groundRefAlt === null) {
const headAlts = pts.slice(0, 10).map((p) => p.alt).filter((a) => a!== null && a!== undefined && Number.isFinite(a));
groundRefAlt = headAlts.length? Math.min(...headAlts): null;
}
const agl = (p) => (groundRefAlt!== null && p.alt!== null && p.alt!== undefined && Number.isFinite(p.alt))? p.alt - groundRefAlt: null;

// 離陸点: GS >= 100kt、または AGL > 200ft が 3 点持続した最初の点
let liftoffIdx = -1;
for (let i = 0; i < pts.length; i++) {
const p = pts[i];
if (p.gs!== null && p.gs!== undefined && p.gs >= LIFTOFF_GS_KT) { liftoffIdx = i; break;}
const a0 = agl(p);
if (a0!== null && a0 > LIFTOFF_ALT_AGL_FT) {
const rest = pts.slice(i, i + 3);
if (rest.length >= 2 && rest.every((q) => { const a = agl(q); return a!== null && a > LIFTOFF_ALT_AGL_FT;})) { liftoffIdx = i; break;}
}
}
if (liftoffIdx <= 0) return null; // 離陸が見つからない / 地上区間がない

const liftoff = pts[liftoffIdx];
const start = pts[0];
const taxiOutMin = (liftoff.ts - start.ts) / 60;
if (!(taxiOutMin > 0)) return null;

// 待機: GS >= 5kt が 3 点連続する最初の点までを「動き始め」とする
let waitMin = taxiOutMin;
for (let i = 0; i + MOVE_SUSTAIN_POINTS - 1 < pts.length && i < liftoffIdx; i++) {
const run = pts.slice(i, i + MOVE_SUSTAIN_POINTS);
if (run.every((q) => q.gs!== null && q.gs!== undefined && q.gs >= MOVE_GS_KT)) {
waitMin = (pts[i].ts - start.ts) / 60;
break;
}
}

// 描画用区間: 離陸点まで、かつ空港中心 6NM 圏内 (圏外に出たらそこで切る)
const centerLat = Number.isFinite(options.centerLat)? options.centerLat: start.lat;
const centerLon = Number.isFinite(options.centerLon)? options.centerLon: start.lon;
let endIdx = liftoffIdx;
for (let i = 0; i <= liftoffIdx; i++) {
if (haversineNm(centerLat, centerLon, pts[i].lat, pts[i].lon) > GROUND_RADIUS_NM) { endIdx = i - 1; break;}
}
if (endIdx < 1) return null;
const segPts = pts.slice(0, endIdx + 1);

let pathLengthNm = 0;
for (let i = 1; i < segPts.length; i++) {
pathLengthNm += haversineNm(segPts[i - 1].lat, segPts[i - 1].lon, segPts[i].lat, segPts[i].lon);
}

let liftoffHeading = (liftoff.track!== null && liftoff.track!== undefined && Number.isFinite(liftoff.track))? liftoff.track: null;
if (liftoffHeading === null && liftoffIdx > 0) {
liftoffHeading = bearingDeg(pts[liftoffIdx - 1].lat, pts[liftoffIdx - 1].lon, liftoff.lat, liftoff.lon);
}

const stride = Math.max(1, Math.ceil(segPts.length / MAX_PLOT_POINTS));
const downsampled = [];
for (let i = 0; i < segPts.length; i += stride) downsampled.push([segPts[i].lat, segPts[i].lon]);
const lastPt = segPts[segPts.length - 1];
const tail = downsampled[downsampled.length - 1];
if (!tail || tail[0]!== lastPt.lat || tail[1]!== lastPt.lon) downsampled.push([lastPt.lat, lastPt.lon]);

return {
points: downsampled,
taxiOutMin: round1(taxiOutMin),
waitMin: round1(Math.min(waitMin, taxiOutMin)),
liftoffHeading: liftoffHeading!== null? Math.round(liftoffHeading): null,
liftoffLat: liftoff.lat,
liftoffLon: liftoff.lon,
pathLengthNm: round1(pathLengthNm),
startTs: start.ts,
liftoffTs: liftoff.ts
};
};

// 離陸点と方位から使用滑走路を推定する。
// 第1段: 滑走路センターライン照合。両端が揃っている滑走路はペアにし、離陸点の
//   センターラインからの横ずれ (perp) が小さく、末端から滑走方向に進んだ範囲内に
//   あるものを候補とする。ORD のように末端が前後にずれた平行滑走路では、離陸点が
//   隣の滑走路の末端に近いことがあり (実測: 28R 離陸点が 28C 末端の 0.7NM 圏内)、
//   末端までの距離だけでは誤判定するため、横ずれを主指標にする。
// 第2段 (フォールバック): ペアが作れない/一致しない場合は末端点ベースで判定する。
//   その際も「末端→離陸点」の方位が出発方位と概ね一致することを条件に加える
//   (これがないと 28C 末端が 28R の離陸点に誤って勝つケースがあった)。
// 端点座標がない場合は平行滑走路を区別できないため null を返す。
export const pairRunwayEnds = (ends) => {
const usable = (Array.isArray(ends) ? ends : []).filter((e) => e && Number.isFinite(e.lat) && Number.isFinite(e.lon) && Number.isFinite(e.headingDeg));
const used = new Set();
const pairs = [];
for (let i = 0; i < usable.length; i++) {
if (used.has(i)) continue;
for (let j = i + 1; j < usable.length; j++) {
if (used.has(j)) continue;
const a = usable[i], b = usable[j];
if (angularDiffDeg(a.headingDeg, b.headingDeg) < 172) continue;   // 互いに逆向きでない
const d = haversineNm(a.lat, a.lon, b.lat, b.lon);
if (d > 0.05) {
if (angularDiffDeg(bearingDeg(a.lat, a.lon, b.lat, b.lon), a.headingDeg) > 12) continue;
if (angularDiffDeg(bearingDeg(b.lat, b.lon, a.lat, a.lon), b.headingDeg) > 12) continue;
}
pairs.push({ a, b });
used.add(i); used.add(j);
break;
}
}
return pairs;
};

export const matchRunway = (liftoffLat, liftoffLon, headingDeg, runwayEnds) => {
if (!Array.isArray(runwayEnds) || runwayEnds.length === 0) return null;
if (headingDeg === null || headingDeg === undefined || !Number.isFinite(headingDeg)) return null;
const ends = runwayEnds.filter((e) => e && Number.isFinite(e.lat) && Number.isFinite(e.lon) && Number.isFinite(e.headingDeg));
if (ends.length === 0) return null;

// 第1段: センターライン照合
const pairs = pairRunwayEnds(ends);
let bestLine = null;
const considerEnd = (depEnd, otherEnd) => {
if (angularDiffDeg(headingDeg, depEnd.headingDeg) > 25) return;
const hRad = toRad(depEnd.headingDeg);
const north = (liftoffLat - depEnd.lat) * 60;
const east = (liftoffLon - depEnd.lon) * 60 * Math.cos(toRad(depEnd.lat));
const along = east * Math.sin(hRad) + north * Math.cos(hRad);
const perp = Math.abs(east * Math.cos(hRad) - north * Math.sin(hRad));
const rwyLen = haversineNm(depEnd.lat, depEnd.lon, otherEnd.lat, otherEnd.lon);
const maxAlong = rwyLen > 0.05 ? rwyLen + 1.0 : 3.7;
if (perp > 0.15 || along < -0.1 || along > maxAlong) return;
const score = perp * 10 + Math.max(0, along) * 0.01;
if (!bestLine || score < bestLine.score) bestLine = { name: depEnd.name, score };
};
for (const pr of pairs) { considerEnd(pr.a, pr.b); considerEnd(pr.b, pr.a); }
if (bestLine) return bestLine.name;
if (pairs.length > 0) return null;   // ペアが作れる空港ではセンターライン照合を正とし、末端点での推測はしない

// 第2段: 末端点ベース (距離 + 方位 + 進行方位)
let best = null;
for (const end of ends) {
const d = haversineNm(liftoffLat, liftoffLon, end.lat, end.lon);
if (d > 1.5) continue;
if (angularDiffDeg(headingDeg, end.headingDeg) > 25) continue;
if (d > 0.05) {
const travelBearing = bearingDeg(end.lat, end.lon, liftoffLat, liftoffLon);
if (angularDiffDeg(travelBearing, end.headingDeg) > 45) continue;
}
if (!best || d < best.dist) best = { name: end.name, dist: d };
}
return best? best.name: null;
};

export const computeTaxiStats = (flights) => {
const list = Array.isArray(flights)? flights: [];
const runwayCounts = {};
for (const f of list) {
const key = f.runway || '不明';
runwayCounts[key] = (runwayCounts[key] || 0) + 1;
}
return {
count: list.length,
medianTaxiOutMin: round1(median(list.map((f) => f.taxiOutMin))),
medianWaitMin: round1(median(list.map((f) => f.waitMin))),
runwayCounts
};
};

// ---------------------------------------------------------------------------
// FR24 API 取得 (プロキシ経由)
// ---------------------------------------------------------------------------

const fr24Get = async (path, fetchImpl) => {
let res;
try {
res = await fetchImpl(PROXY_BASE + path);
} catch (e) {
throw new TaxiBriefError('NETWORK', 'FR24 API への接続に失敗しました');
}
if (res.status === 501) {
let body = null;
try { body = await res.json();} catch (e) { /* 本文なしでも未設定扱いにする */}
if (body && typeof body.error === 'string' && body.error.includes('FR24_API_TOKEN')) {
throw new TaxiBriefError('UNCONFIGURED', 'FR24 APIが未設定です', 501);
}
throw new TaxiBriefError('UPSTREAM', 'FR24 API プロキシが未設定です', 501);
}
if (!res.ok) {
throw new TaxiBriefError('UPSTREAM', `FR24 API がエラーを返しました (${res.status})`, res.status);
}
try {
return await res.json();
} catch (e) {
throw new TaxiBriefError('BAD_RESPONSE', 'FR24 API の応答を読み取れませんでした', res.status);
}
};

const fetchAirport = async (originIcao, fetchImpl) => {
// ドキュメント記載パス → SDK パスの順に試す。失敗しても致命傷ではない (中心は軌跡で代替)。
try {
const json = await fr24Get(`/airports/full/${encodeURIComponent(originIcao)}`, fetchImpl);
const ap = normaliseAirport(json);
if (ap && (ap.lat!== null || ap.runways.length > 0)) return ap;
} catch (e) {
if (!e || e.status!== 404) { /* 404 以外でもフォールバックは試す */}
}
try {
const json = await fr24Get(`/static/airports/${encodeURIComponent(originIcao)}/full`, fetchImpl);
return normaliseAirport(json);
} catch (e) {
return null;
}
};

const isoNoMs = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

export const fetchTaxiBriefing = async ({ flightNoIata, originIcao, daysBack = 30, maxFlights = 8, fetchImpl} = {}) => {
const doFetch = fetchImpl || (typeof fetch!== 'undefined'? fetch: null);
if (!doFetch) throw new TaxiBriefError('NETWORK', 'fetch が利用できません');
if (!flightNoIata ||!originIcao) throw new TaxiBriefError('NO_FLIGHTS', '便名または出発地が不明です');

const to = new Date();
const from = new Date(to.getTime() - daysBack * 86400 * 1000);
const query = [
`flights=${encodeURIComponent(flightNoIata)}`,
`airports=${encodeURIComponent(originIcao)}`,
`flight_datetime_from=${encodeURIComponent(isoNoMs(from))}`,
`flight_datetime_to=${encodeURIComponent(isoNoMs(to))}`,
`limit=${Math.max(10, maxFlights * 3)}`,
'sort=desc'
].join('&');

const summaryJson = await fr24Get(`/flight-summary/light?${query}`, doFetch);
const seen = new Set();
const items = normaliseSummaryItems(summaryJson)
.filter((it) => {
if (it.originIcao && it.originIcao.toUpperCase()!== String(originIcao).toUpperCase()) return false;
if (seen.has(it.fr24Id)) return false;
seen.add(it.fr24Id);
return true;
})
.sort((a, b) => (b.takeoffTs || 0) - (a.takeoffTs || 0))
.slice(0, maxFlights);

if (items.length === 0) {
throw new TaxiBriefError('NO_FLIGHTS', '対象の便が見つかりませんでした');
}

const airport = await fetchAirport(originIcao, doFetch);

const flights = [];
let skipped = 0;
for (const item of items) {
try {
const trackJson = await fr24Get(`/flight-tracks?flight_id=${encodeURIComponent(item.fr24Id)}`, doFetch);
const rawPoints = normaliseTrackPoints(trackJson);
if (rawPoints.length < 3) { skipped++; continue;}
const seg = extractGroundSegment(rawPoints, {
centerLat: airport? airport.lat: null,
centerLon: airport? airport.lon: null,
elevationFt: airport? airport.elevationFt: null
});
if (!seg) { skipped++; continue;}
flights.push({
fr24Id: item.fr24Id,
dateUtc: item.takeoffUtc || new Date(seg.liftoffTs * 1000).toISOString(),
registration: item.registration || null,
points: seg.points,
taxiOutMin: seg.taxiOutMin,
waitMin: seg.waitMin,
liftoffHeading: seg.liftoffHeading,
runway: matchRunway(seg.liftoffLat, seg.liftoffLon, seg.liftoffHeading, airport? airport.runways: []),
pathLengthNm: seg.pathLengthNm
});
} catch (e) {
skipped++;
}
}

if (flights.length === 0) {
throw new TaxiBriefError('NO_FLIGHTS', '地上軌跡のある便が見つかりませんでした');
}

return {
flightNo: flightNoIata,
origin: originIcao,
fetchedAt: new Date().toISOString(),
demo: false,
flights,
stats: computeTaxiStats(flights),
skipped
};
};

// ---------------------------------------------------------------------------
// デモ用フィクスチャ (KORD / NH8421 の実績パターンを模した合成軌跡)
// 形状は実測で裏付けた: FR24 CSV 6 便 (2026-10-27〜11-07、全て NH8421) の地上軌跡は
// いずれも「南カーゴのスポット (空港中心の南西約0.7NM) → S を東進 → 北東へ上がり
// W を東進 → 28R 末端 (中心の東約1.05NM) から西向きフルレングス離陸」で、抽出器の
// タクシーアウトは実績比 +0.0〜+0.2 分だった。表示する 4 便の時刻・待機・タクシー
// アウトは再生で確認した 4 便 (11-09/10/12/14) の実績値。変型は 11-12 の 27L 便
// (東端で W を西へ戻るジョグ → 北へ横断 → 27L)。相対座標 [東NM, 北NM] は
// 空港中心 (41.9742, -87.9073) 基準で、滑走路末端は FAA 公開座標そのもの。
// 合成ポイント列を実データと同じ extractGroundSegment / matchRunway に通して返す。
// UI 側で必ずデモ表示すること。
// ---------------------------------------------------------------------------

const DEMO_ANCHOR = { lat: 41.9742, lon: -87.9073}; // KORD 中心
const DEMO_ELEVATION_FT = 680;

const offsetToLatLon = (eNm, nNm) => [
DEMO_ANCHOR.lat + nNm / 60,
DEMO_ANCHOR.lon + eNm / (60 * Math.cos(toRad(DEMO_ANCHOR.lat)))
];

// 標準型: [東NM, 北NM] の経由点列 (ランプ → S東進 → W東進 → 東端北上 → 28R進入 → 離陸点)
const DEMO_PATH_STANDARD = [
[-0.17, -0.68], [-0.08, -0.72], [0.20, -0.72], [0.32, -0.60], [0.42, -0.47],
[0.60, -0.41], [0.90, -0.41], [1.00, -0.36], [1.04, -0.31]
];
// 変型 (27L): 東端で W を少し西へ戻り、空港を北へ横断して 27L 東端へ
const DEMO_PATH_VARIANT_27L = [
[-0.17, -0.68], [-0.08, -0.72], [0.20, -0.72], [0.32, -0.60], [0.42, -0.47],
[0.60, -0.41], [0.95, -0.41], [0.70, -0.41], [0.78, -0.10], [0.80, 0.30],
[0.81, 0.58]
];

const DEMO_RUNWAY_ENDS = [
{ name: '10L', headingDeg: 90, lat: 41.96900, lon: -87.93150 },
{ name: '28R', headingDeg: 270, lat: 41.96910, lon: -87.88370 },
{ name: '10C', headingDeg: 90, lat: 41.96570, lon: -87.93150 },
{ name: '28C', headingDeg: 270, lat: 41.96570, lon: -87.89180 },
{ name: '10R', headingDeg: 90, lat: 41.95720, lon: -87.92790 },
{ name: '28L', headingDeg: 270, lat: 41.95724, lon: -87.90029 },
{ name: '9R', headingDeg: 90, lat: 41.98390, lon: -87.91835 },
{ name: '27L', headingDeg: 270, lat: 41.98390, lon: -87.88905 },
{ name: '09C', headingDeg: 90, lat: 41.98831, lon: -87.93158 },
{ name: '27C', headingDeg: 270, lat: 41.98833, lon: -87.89021 }
];

// 経由点列とタイミング計画から、実データと同じ形のポイント列を合成する
const synthTrackPoints = ({ pathOffsets, startIso, waitMin, taxiOutMin}) => {
const startTs = Date.parse(startIso) / 1000;
const pts = [];
const [startLat, startLon] = offsetToLatLon(pathOffsets[0][0], pathOffsets[0][1]);

// 待機フェーズ: 30 秒間隔、GS 0〜3kt、ほぼ静止
const waitSec = waitMin * 60;
for (let t = 0; t < waitSec; t += 30) {
pts.push({ lat: startLat, lon: startLon, alt: DEMO_ELEVATION_FT, gs: (pts.length % 3), track: 90, ts: startTs + t});
}
// タクシーフェーズ: 経由点列を一定速度でなぞる (20 秒間隔)
const rollSec = 42; // 離陸滑走に要する目安
const taxiSec = Math.max(60, taxiOutMin * 60 - waitSec - rollSec);
const latLons = pathOffsets.map(([e, n]) => offsetToLatLon(e, n));
const cum = [0];
for (let i = 1; i < latLons.length; i++) {
cum.push(cum[i - 1] + haversineNm(latLons[i - 1][0], latLons[i - 1][1], latLons[i][0], latLons[i][1]));
}
const totalNm = cum[cum.length - 1];
const taxiStartTs = startTs + waitSec;
const stepSec = 20;
for (let t = 0; t < taxiSec; t += stepSec) {
const dist = totalNm * (t / taxiSec);
let i = 1;
while (i < cum.length - 1 && cum[i] < dist) i++;
const segLen = Math.max(1e-6, cum[i] - cum[i - 1]);
const frac = Math.min(1, Math.max(0, (dist - cum[i - 1]) / segLen));
const lat = latLons[i - 1][0] + (latLons[i][0] - latLons[i - 1][0]) * frac;
const lon = latLons[i - 1][1] + (latLons[i][1] - latLons[i - 1][1]) * frac;
pts.push({
lat, lon, alt: DEMO_ELEVATION_FT, gs: 14,
track: Math.round(bearingDeg(latLons[i - 1][0], latLons[i - 1][1], latLons[i][0], latLons[i][1])),
ts: taxiStartTs + t
});
}
// 離陸滑走 + 上昇 (抽出側で切り落とされることを確認するための空中点を含む)
const endPt = latLons[latLons.length - 1];
const rollStartTs = taxiStartTs + taxiSec;
const rollProfile = [18, 35, 55, 75, 92, 108, 125];
rollProfile.forEach((gs, i) => {
pts.push({
lat: endPt[0], lon: endPt[1] - i * 0.0018, alt: DEMO_ELEVATION_FT, gs,
track: 270, ts: rollStartTs + i * 7
});
});
const liftoffTsApprox = rollStartTs + 5 * 7;
[[150, 500], [168, 1200], [185, 2100]].forEach(([gs, aglFt], i) => {
pts.push({
lat: endPt[0] + 0.004 * (i + 1), lon: endPt[1] - 0.012 * (i + 1),
alt: DEMO_ELEVATION_FT + aglFt, gs, track: 285, ts: liftoffTsApprox + 12 * (i + 1)
});
});
return pts;
};

export const demoTaxiBriefing = (originIcao, flightNoIata) => {
const specs = [
{ startIso: '2026-11-14T15:08:00Z', registration: 'JA771F', pathOffsets: DEMO_PATH_STANDARD, waitMin: 37, taxiOutMin: 46},
{ startIso: '2026-11-10T15:22:00Z', registration: 'JA772F', pathOffsets: DEMO_PATH_STANDARD, waitMin: 13, taxiOutMin: 19},
{ startIso: '2026-11-09T15:17:00Z', registration: 'JA771F', pathOffsets: DEMO_PATH_STANDARD, waitMin: 17, taxiOutMin: 28},
{ startIso: '2026-11-12T15:23:00Z', registration: 'JA771F', pathOffsets: DEMO_PATH_VARIANT_27L, waitMin: 18, taxiOutMin: 41}
];
const flights = [];
for (const spec of specs) {
const raw = synthTrackPoints(spec);
const seg = extractGroundSegment(raw, {
centerLat: DEMO_ANCHOR.lat, centerLon: DEMO_ANCHOR.lon, elevationFt: DEMO_ELEVATION_FT
});
if (!seg) continue;
flights.push({
fr24Id: null,
dateUtc: new Date(seg.liftoffTs * 1000).toISOString(),
registration: spec.registration,
points: seg.points,
taxiOutMin: seg.taxiOutMin,
waitMin: seg.waitMin,
liftoffHeading: seg.liftoffHeading,
runway: matchRunway(seg.liftoffLat, seg.liftoffLon, seg.liftoffHeading, DEMO_RUNWAY_ENDS),
pathLengthNm: seg.pathLengthNm
});
}
return {
flightNo: flightNoIata || 'NH8421',
origin: originIcao || 'KORD',
fetchedAt: new Date().toISOString(),
demo: true,
demoNote: 'KORD NH8421 の実績パターン (28R 標準型 ×3 / 27L 変型 ×1) を基にしたデモ軌跡です',
flights,
stats: computeTaxiStats(flights),
skipped: 0
};
};

// ---------------------------------------------------------------------------
// FR24 サイト CSV 取込 (2026-11-16 v1.1)
// FR24 API (Essential) を契約しなくても、GOLD プランで FR24 サイトの便履歴から
// ダウンロードできる軌跡 CSV を取り込めば、API 経路と同じ抽出・統計が得られる。
// CSV 形式 (実ファイルで確認): ヘッダは
//   Timestamp,UTC,Callsign,Position,Altitude,Speed,Direction
// で、Position は "lat,lon" と引用符付きでカンマを含む。Timestamp はエポック秒、
// UTC は ISO 文字列、Altitude は ft、Speed は kt、Direction は度。
// ---------------------------------------------------------------------------

// 同梱滑走路テーブル (滑走路「両端」の座標)。API の airports/full が使えない
// CSV 経路でも matchRunway (センターライン照合) が効くようにするための最小限の
// データで、現状は検証済みの KORD のみ。座標は FAA 公開値で、DEMO_RUNWAY_ENDS と
// 同一 (NH8421 実 CSV 6 便で 28R×5 / 09C×1 の 6/6 一致を検証済み)。
export const BUNDLED_RUNWAYS = {
KORD: DEMO_RUNWAY_ENDS
};

// 引用符 ("..." 内のカンマと "" エスケープ) を扱う最小 CSV 行パーサ
const splitCsvLine = (line) => {
const fields = [];
let cur = '';
let inQuotes = false;
for (let i = 0; i < line.length; i++) {
const ch = line[i];
if (inQuotes) {
if (ch === '"') {
if (line[i + 1] === '"') { cur += '"'; i++; }
else inQuotes = false;
} else cur += ch;
} else if (ch === '"') {
inQuotes = true;
} else if (ch === ',') {
fields.push(cur); cur = '';
} else cur += ch;
}
fields.push(cur);
return fields;
};

// FR24 サイト CSV → { callsign, points, firstTs, lastTs }
// points は normaliseTrackPoint と同じ形 {lat, lon, alt, gs, track, ts} (時刻昇順)。
// ヘッダが見つからない・読める行がない場合は points: [] を返す (例外は投げない)。
export const parseFr24Csv = (text) => {
const empty = { callsign: null, points: [], firstTs: null, lastTs: null };
if (typeof text!== 'string' ||!text.trim()) return empty;
const lines = text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/);
let headerIdx = -1;
let cols = null;
for (let i = 0; i < Math.min(lines.length, 5); i++) {
if (!lines[i].trim()) continue;
const f = splitCsvLine(lines[i]).map((s) => s.trim().toLowerCase());
if (f.includes('position') && (f.includes('utc') || f.includes('timestamp'))) { headerIdx = i; cols = f; break; }
}
if (headerIdx < 0 ||!cols) return empty;
const idxOf = (name) => cols.indexOf(name);
const iTs = idxOf('timestamp'), iUtc = idxOf('utc'), iCall = idxOf('callsign');
const iPos = idxOf('position'), iAlt = idxOf('altitude'), iSpd = idxOf('speed'), iDir = idxOf('direction');
if (iPos < 0) return empty;

let callsign = null;
const points = [];
for (let i = headerIdx + 1; i < lines.length; i++) {
if (!lines[i].trim()) continue;
const f = splitCsvLine(lines[i]);
const posParts = String(f[iPos] || '').split(',');
if (posParts.length < 2) continue;
let ts = iTs >= 0? parseFloat(f[iTs]): NaN;
if (!Number.isFinite(ts) && iUtc >= 0) ts = Date.parse(f[iUtc]) / 1000;
if (!Number.isFinite(ts)) continue;
if (!callsign && iCall >= 0 && f[iCall]) callsign = String(f[iCall]).trim();
const p = normaliseTrackPoint({
lat: parseFloat(posParts[0]),
lon: parseFloat(posParts[1]),
alt: iAlt >= 0? f[iAlt]: null,
gs: iSpd >= 0? f[iSpd]: null,
track: iDir >= 0? f[iDir]: null,
timestamp: ts
});
if (p) points.push(p);
}
points.sort((a, b) => a.ts - b.ts);
return {
callsign,
points,
firstTs: points.length? points[0].ts: null,
lastTs: points.length? points[points.length - 1].ts: null
};
};

// 便エントリの同一性キー (日付 + 開始時刻)。CSV 由来は startTs を持つ。
// API 由来 (startTs なし) は dateUtc (離陸時刻 ISO) 自体がほぼ一意なのでそれで足りる。
const flightMergeKey = (f) => {
if (!f) return '';
const ts = (f.startTs!== null && f.startTs!== undefined)? f.startTs
: (f.liftoffTs!== null && f.liftoffTs!== undefined)? f.liftoffTs: null;
return `${f.dateUtc || ''}|${ts!== null? ts: ''}`;
};

const flightSortTs = (f) => {
if (!f) return 0;
if (Number.isFinite(f.startTs)) return f.startTs;
if (Number.isFinite(f.liftoffTs)) return f.liftoffTs;
const t = Date.parse(f.dateUtc || '');
return Number.isFinite(t)? t / 1000: 0;
};

// 既存便リストへ新規便をマージする (同一キーは新規側で上書き、新しい順、上限つき)
export const mergeBriefingFlights = (existingFlights, newFlights, maxFlights = 12) => {
const byKey = new Map();
const add = (f) => { if (f) byKey.set(flightMergeKey(f), f); };
(Array.isArray(existingFlights)? existingFlights: []).forEach(add);
(Array.isArray(newFlights)? newFlights: []).forEach(add);
return [...byKey.values()]
.sort((a, b) => flightSortTs(b) - flightSortTs(a))
.slice(0, Math.max(0, maxFlights));
};

// CSV テキスト群 → ブリーフィング素材 { source:'csv', flights, skipped, stats }
// 地上区間が取れなかった CSV は skipped に数える (例外で全体を落とさない)。
// 滑走路判定は BUNDLED_RUNWAYS (出発地が表にあれば) を使い、無ければ runway: null
// (離陸方位は保持する)。マージ (既存キャッシュとの統合) は呼び出し側の責務。
export const briefingFromCsvList = (csvTexts, { originIcao, originLatLon } = {}) => {
const texts = Array.isArray(csvTexts)? csvTexts: [];
const ends = (originIcao && BUNDLED_RUNWAYS[String(originIcao).toUpperCase()]) || [];
const centerLat = (originLatLon && Number.isFinite(originLatLon.lat))? originLatLon.lat: null;
const centerLon = (originLatLon && Number.isFinite(originLatLon.lon))? originLatLon.lon: null;
const flights = [];
const seenKeys = new Set();
let skipped = 0;
for (const text of texts) {
let parsed = null;
try { parsed = parseFr24Csv(text); } catch (e) { parsed = null; }
if (!parsed || parsed.points.length < 3) { skipped++; continue; }
const seg = extractGroundSegment(parsed.points, { centerLat, centerLon, elevationFt: null });
if (!seg) { skipped++; continue; }
const flight = {
fr24Id: null,
dateUtc: new Date(seg.startTs * 1000).toISOString(),
registration: null,
callsign: parsed.callsign || null,
startTs: seg.startTs,
points: seg.points,
taxiOutMin: seg.taxiOutMin,
waitMin: seg.waitMin,
liftoffHeading: seg.liftoffHeading,
runway: matchRunway(seg.liftoffLat, seg.liftoffLon, seg.liftoffHeading, ends),
pathLengthNm: seg.pathLengthNm
};
const key = flightMergeKey(flight);
if (seenKeys.has(key)) continue; // 同じ CSV の二重選択は黙って1件にする
seenKeys.add(key);
flights.push(flight);
}
flights.sort((a, b) => flightSortTs(b) - flightSortTs(a));
return {
source: 'csv',
flights,
skipped,
stats: computeTaxiStats(flights)
};
};

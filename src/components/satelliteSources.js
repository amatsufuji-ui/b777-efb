// =========================================================================
// satelliteSources.js
// 静止気象衛星のソース定義と、経度に応じた衛星選択ロジック
//
// 考え方:
//   静止衛星の画像は、その衛星の直下点 (sub-satellite point) から離れるほど
//   幾何学的に引き伸ばされ、解像度も落ちる。そこで地図上の各経度を
//   「直下点が最も近い衛星」に割り当て、その衛星の担当範囲 (windowLon)
//   の中だけでタイルを読み込むようにする。範囲外のタイルは Leaflet の
//   bounds オプションでそもそも取得しないため、他衛星の縁の歪んだ画像が
//   重なって表示されることもない。
//
//   担当範囲の境界は、隣り合う衛星の直下点の中点。
//     GOES-W(-137.2) | GOES-E(-75.2) | MET-0(0) | MET-IODC(41.5) | HIMAWARI(140.7)
//   境界:        -106.2          -37.6        +20.8           +91.1   (日付変更線付近 ≈ -178.3)
//
// 確認済みソース (2026-11-12 実測):
//   Himawari-9 : JMA タイル (SND カラー) + targetTimes_fd.json … 200 / image/jpeg
//   GOES-East  : GOES-19 GeoColor を NASA GIBS WMTS (EPSG:3857) タイルで取得。
//                time=default が使えるため時刻解決コード不要。… 200 / image/png
//                (代替: Iowa State IEM の再投影済み IR タイルも 200 を確認済み。
//                 NESDIS CDN の GeoColor は単一画像のみで XYZ タイルではないため地図には不採用)
//   GOES-West  : GOES-18 GeoColor。同上 (GIBS WMTS)
//   Meteosat   : EUMETSAT WMS (view.eumetsat.int) msg_fes:ir108 / msg_iodc:ir108 … 200 / image/png
//   ※ GIBS には Meteosat 系レイヤーが無いため、全域を単一タイルIFで統一することはできない
// =========================================================================

export const GEO_SATELLITES = [
  {
    id: 'goes-west',
    name: 'GOES-West',
    satellite: 'GOES-18',
    shortLabel: 'GOES-W',
    subLon: -137.2,
    windowLon: [-178.3, -106.2],
    product: 'GeoColor tiles (NASA GIBS WMTS)',
    attribution: 'NASA GIBS — GOES-West ABI GeoColor',
  },
  {
    id: 'goes-east',
    name: 'GOES-East',
    satellite: 'GOES-19',
    shortLabel: 'GOES-E',
    subLon: -75.2,
    windowLon: [-106.2, -37.6],
    product: 'GeoColor tiles (NASA GIBS WMTS)',
    attribution: 'NASA GIBS — GOES-East ABI GeoColor',
  },
  {
    id: 'meteosat-fes',
    name: 'Meteosat 0°',
    satellite: 'Meteosat-11',
    shortLabel: 'MET-0°',
    subLon: 0.0,
    windowLon: [-37.6, 20.8],
    product: 'IR 10.8 (EUMETSAT WMS)',
    attribution: 'EUMETSAT Meteosat 0° IR10.8',
  },
  {
    id: 'meteosat-iodc',
    name: 'Meteosat IODC',
    satellite: 'Meteosat-8',
    shortLabel: 'MET-IODC',
    subLon: 41.5,
    windowLon: [20.8, 91.1],
    product: 'IR 10.8 (EUMETSAT WMS)',
    attribution: 'EUMETSAT Meteosat IODC IR10.8',
  },
  {
    id: 'himawari',
    name: 'Himawari',
    satellite: 'Himawari-9',
    shortLabel: 'HIMAWARI',
    subLon: 140.7,
    // 日付変更線をまたぐ担当範囲のうち、西側の細い部分 (-180..-178.3) は
    // bounds の都合で省略している (pickSatelliteForLongitude は距離判定なので影響なし)
    windowLon: [91.1, 180.0],
    product: 'SND colour tiles (JMA)',
    attribution: 'JMA Himawari-9',
  },
];

// 静止衛星が実用的に使える緯度範囲 (これより高緯度は縁の歪みが支配的になる)
export const GEO_LAT_LIMIT = 78;

// 経度を -180..180 に正規化
export const normalizeLon180 = (lon) => (((lon + 180) % 360) + 360) % 360 - 180;

const angularDistanceDeg = (a, b) => Math.abs(normalizeLon180(a - b));

// 経度に対して直下点が最も近い衛星を返す
export const pickSatelliteForLongitude = (lon) => {
  const l = normalizeLon180(lon);
  let best = null;
  let bestDist = Infinity;
  GEO_SATELLITES.forEach((s) => {
    const d = angularDistanceDeg(l, s.subLon);
    if (d < bestDist) { bestDist = d; best = s; }
  });
  return best;
};

export const satelliteById = (id) => GEO_SATELLITES.find((s) => s.id === id) || null;

// Leaflet の tileLayer 用 bounds (L 名前空間を渡す)。衛星の担当範囲内だけタイル取得する。
export const latLngBoundsForSatellite = (L, id) => {
  const s = satelliteById(id);
  if (!s || !L) return undefined;
  return L.latLngBounds([-GEO_LAT_LIMIT, s.windowLon[0]], [GEO_LAT_LIMIT, s.windowLon[1]]);
};

// -------------------------------------------------------------------------
// URL ビルダー (地図表示と疎通確認テストで共用)
// -------------------------------------------------------------------------

// GOES GeoColor (NASA GIBS WMTS, EPSG:3857 / GoogleMapsCompatible_Level7 = z7 まで)
// time には literal の "default" が使える (GIBS 側で最新時刻に解決される) ため、
// アプリ側で時刻を計算する必要がない。WMTS REST のパス順は {z}/{y}/{x}。
export const buildGoesTileUrl = (satId) => (satId === 'goes-west'
  ? 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-West_ABI_GeoColor/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png'
  : 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_GeoColor/default/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png');

// 代替ソース (フォールバック用): Iowa State IEM の再投影済み GOES IR タイル。
// GIBS GeoColor は伝搬遅延が概ね 30-60 分あるのに対し、IEM の IR は比較的新しい。
// 白黒IRでよい場合はこちらに切り替えられる。
export const GOES_IEM_TILE_URLS = {
  'goes-east': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-ir-4km-900913/{z}/{x}/{y}.png',
  'goes-west': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-west-ir-4km-900913/{z}/{x}/{y}.png',
};

// Meteosat (EUMETSAT WMS)
export const EUMETSAT_WMS_URL = 'https://view.eumetsat.int/geoserver/ows';
export const buildMeteosatWmsParams = (satId) => ({
  layers: satId === 'meteosat-iodc' ? 'msg_iodc:ir108' : 'msg_fes:ir108',
  format: 'image/png',
  transparent: true,
  version: '1.3.0',
});

// Himawari-9 (JMA タイル)。frame は targetTimes_fd.json の要素 { basetime, validtime }
export const buildHimawariTileUrl = (frame) => {
  if (!frame || !frame.basetime || !frame.validtime) return null;
  return `https://www.jma.go.jp/bosai/himawari/data/satimg/${frame.basetime}/fd/${frame.validtime}/SND/ETC/{z}/{x}/{y}.jpg`;
};

// -------------------------------------------------------------------------
// 疎通確認用ヘルパー: 緯度経度を含む XYZ タイル番号と、検証用 URL の生成
// -------------------------------------------------------------------------
export const tileXYForLatLon = (lat, lon, z) => {
  const n = Math.pow(2, z);
  const x = Math.floor(((normalizeLon180(lon) + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
};

export const fillTileTemplate = (template, lat, lon, z) => {
  const { x, y } = tileXYForLatLon(lat, lon, z);
  return template.replace('{z}', z).replace('{x}', x).replace('{y}', y);
};

// WMS 検証用: 指定点を含む 256x256 (EPSG:3857) の GetMap URL
export const buildMeteosatGetMapUrl = (satId, lat, lon) => {
  const R = 6378137;
  const mx = (R * normalizeLon180(lon) * Math.PI) / 180;
  const my = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const half = 10018754.17 / 8; // z=2 相当のタイル半幅 (m)
  const bbox = `${mx - half},${my - half},${mx + half},${my + half}`;
  const p = buildMeteosatWmsParams(satId);
  return `${EUMETSAT_WMS_URL}?service=WMS&version=1.3.0&request=GetMap&layers=${encodeURIComponent(p.layers)}&styles=&crs=EPSG:3857&bbox=${bbox}&width=256&height=256&format=image/png&transparent=true`;
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
// 衛星ソース定義・担当衛星の自動判定・担当範囲クリップは satelliteSources.js に分離
import { pickSatelliteForLongitude, latLngBoundsForSatellite, buildGoesTileUrl, buildHimawariTileUrl, buildMeteosatWmsParams, EUMETSAT_WMS_URL } from './satelliteSources';

// =========================================================================
// アイコンコンポーネント
// =========================================================================
const IconCloudRain = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v6" /><path d="M8 14v6" /><path d="M12 16v6" />
  </svg>
);
const IconLoader2 = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IconRefresh = ({ className = "w-4 h-4" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

// =========================================================================
// UI Component: Toast
// =========================================================================
const Toast = ({ message, visible, onClose }) => {
  if (!visible) return null;
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-slate-800 border border-slate-600 text-white px-4 py-3 rounded shadow-2xl flex items-center gap-3">
      <span className="text-sm font-bold">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
    </div>
  );
};

// =========================================================================
// 空港座標辞書 (出発地・目的地等のプロット用)
// =========================================================================
const ICAO_COORDS = {
  "RJTT": { lat: 35.5494, lon: 139.7798 }, "RJAA": { lat: 35.7647, lon: 140.3863 },
  "RJCC": { lat: 42.7752, lon: 141.6925 }, "RJBB": { lat: 34.4347, lon: 135.2442 },
  "RJOO": { lat: 34.7855, lon: 135.4382 }, "ROAH": { lat: 26.1958, lon: 127.6458 },
  "RJFF": { lat: 33.5859, lon: 130.4506 }, "KJFK": { lat: 40.6413, lon: -73.7781 },
  "KIAD": { lat: 38.9445, lon: -77.4558 }, "KORD": { lat: 41.9742, lon: -87.9073 },
  "KIAH": { lat: 29.9805, lon: -95.3397 }, "KLAX": { lat: 33.9416, lon: -118.4085 },
  "KSFO": { lat: 37.6213, lon: -122.3790 }, "KSEA": { lat: 47.4489, lon: -122.3090 },
  "PHNL": { lat: 21.3187, lon: -157.9225 }, "CYVR": { lat: 49.1967, lon: -123.1815 },
  "MMMX": { lat: 19.4361, lon: -99.0719 }, "LFPG": { lat: 49.0097, lon: 2.5479 },
  "EGLL": { lat: 51.4700, lon: -0.4543 }, "EDDF": { lat: 50.0379, lon: 8.5622 },
  "EDDM": { lat: 48.3538, lon: 11.7861 }, "LOWW": { lat: 48.1103, lon: 16.5697 },
  "EBBR": { lat: 50.9014, lon: 4.4844 }, "ESSA": { lat: 59.6519, lon: 17.9186 },
  "LIMC": { lat: 45.6301, lon: 8.7231 }, "LTFM": { lat: 41.2753, lon: 28.7520 },
  "YSSY": { lat: -33.9461, lon: 151.1772 }, "YPPH": { lat: -31.9403, lon: 115.9668 },
  "VHHH": { lat: 22.3080, lon: 113.9185 }, "WSSS": { lat: 1.3644, lon: 103.9915 },
  "VTBS": { lat: 13.6900, lon: 100.7501 }, "RCTP": { lat: 25.0777, lon: 121.2328 },
  "RCSS": { lat: 25.0697, lon: 121.5520 }, "RKSI": { lat: 37.4602, lon: 126.4407 },
  "RKSS": { lat: 37.5583, lon: 126.7906 }, "ZBAA": { lat: 40.0799, lon: 116.6031 },
  "ZSPD": { lat: 31.1443, lon: 121.8083 }, "ZSSS": { lat: 31.1979, lon: 121.3363 },
  "ZGGG": { lat: 23.3924, lon: 113.2988 }, "ZSAM": { lat: 24.5440, lon: 118.1277 },
  "ZSHC": { lat: 30.2295, lon: 120.4345 }, "ZGSZ": { lat: 22.6393, lon: 113.8107 },
  "ZYTL": { lat: 38.9657, lon: 121.5386 }, "WMKK": { lat: 2.7456, lon: 101.7099 },
  "WIII": { lat: -6.1256, lon: 106.6559 }, "VVTS": { lat: 10.8188, lon: 106.6520 },
  "VVNB": { lat: 21.2212, lon: 105.8072 }, "RPLL": { lat: 14.5086, lon: 121.0194 },
  "VYYY": { lat: 16.9022, lon: 96.1332 }, "VDPP": { lat: 11.5466, lon: 104.8441 },
  "VABB": { lat: 19.0896, lon: 72.8656 }, "VIDP": { lat: 28.5562, lon: 77.1000 },
  "VOMM": { lat: 12.9941, lon: 80.1709 }, "PANC": { lat: 61.1744, lon: -149.9963 }
};

// =========================================================================
// 訓練空域・制限空域 (AIRSPACE DATA)
// =========================================================================
const AIRSPACE_DATA = [
  { name: 'ITRA-E', type: 'itra', alt: 'FL250', coords: [[36.1536, 131.5753], [35.8286, 132.2222], [35.5706, 132.1753], [35.5525, 130.7639]] },
  { name: 'ITRA-N1', type: 'itra', alt: 'FL180', coords: [[35.5706, 132.1753], [35.3500, 132.1353], [35.3269, 132.2653], [35.1164, 130.1892], [35.5525, 130.7639]] },
  { name: 'ITRA-N2', type: 'itra', alt: 'FL800', coords: [[35.3269, 132.2653], [35.3014, 132.3139], [35.2919, 132.3372], [35.0375, 131.9897], [34.7236, 131.3769], [34.6864, 130.8808], [34.7253, 130.8669], [34.8531, 130.5850], [34.7697, 130.5253], [34.9953, 130.0311], [35.1164, 130.1892]] },
  { name: 'ITRA-N3', type: 'itra', alt: 'FL240', coords: [[35.3014, 132.3139], [35.2919, 132.3372], [35.0375, 131.9897], [34.7236, 131.3769], [34.7208, 131.3386], [35.0353, 131.6914], [35.2103, 131.7392], [35.2906, 132.2003]] },
  { name: 'ITRA-S (S11-S16)', type: 'itra', alt: 'S11-16: UNL', coords: [[30.2008, 131.5011], [30.4875, 131.2867], [30.9519, 131.6467], [31.5119, 132.1558], [32.0036, 132.5808], [32.0536, 132.6308], [32.0822, 132.7872], [32.3019, 133.4381], [32.5667, 133.9397], [32.5897, 133.9867], [32.6200, 134.0475], [32.7803, 134.5333], [32.8981, 135.0139], [32.5911, 135.0139], [32.5536, 135.0139]] },
  { name: 'ITRA-S (S20-S25)', type: 'itra', alt: 'S20-25: FL450', coords: [[30.2008, 131.5011], [32.5536, 135.0139], [32.1533, 135.0094], [29.9272, 131.7381]] },
  { name: 'ITRA-S (S30-S33)', type: 'itra', alt: 'FL250', coords: [[29.9272, 131.7381], [32.1533, 135.0094], [31.3019, 135.0000], [29.4689, 132.4039]] },
  { name: 'MOOSE NORTH', type: 'training', alt: 'SFC - UNL', coords: [[26.9758, 124.9558], [28.4786, 127.0542], [27.8033, 127.3211], [27.2986, 127.2208], [27.0842, 126.9942], [26.6953, 125.2111]] },
  { name: 'MOOSE SOUTH', type: 'training', alt: 'SFC - UNL', coords: [[26.6953, 125.2111], [27.0842, 126.9942], [26.2675, 126.1431], [26.2389, 125.6219]] },
  { name: 'TIGER WEST', type: 'training', alt: 'SFC - UNL', coords: [[26.7900, 129.0672], [27.4686, 129.5064], [27.6461, 130.5586]] },
  { name: 'TIGER CENTER', type: 'training', alt: 'SFC - UNL', coords: [[26.3692, 128.5783], [26.7900, 129.0672], [27.6461, 130.5586], [27.6431, 130.9317], [27.6281, 132.0375], [27.4436, 131.9947], [26.1822, 130.8433]] },
  { name: 'TIGER EAST', type: 'training', alt: 'SFC - UNL', coords: [[27.4436, 131.9947], [26.7961, 131.8456], [26.4572, 131.5717], [26.1417, 131.2814], [26.1822, 130.8433]] },
  { name: 'LION WEST', type: 'training', alt: 'SFC - UNL', coords: [[25.4625, 128.0600], [24.3797, 127.3061], [24.4653, 127.0953], [25.3761, 127.7264]] },
  { name: 'LION CENTER', type: 'training', alt: 'SFC - UNL', coords: [[25.5186, 128.1647], [24.3911, 129.4597], [23.7003, 128.9464], [24.3797, 127.3061]] },
  { name: 'EAGLE CENTER', type: 'training', alt: 'SFC - UNL', coords: [[25.8931, 128.5000], [25.8103, 129.0386], [25.7375, 129.4311], [25.7458, 130.4036], [25.7397, 130.5003], [24.6639, 129.6653], [24.3911, 129.4597], [25.5186, 128.1647]] },
  { name: 'EAGLE EAST', type: 'training', alt: 'SFC - UNL', coords: [[25.7397, 130.5003], [25.7108, 130.9244], [25.1539, 130.4914], [24.9411, 130.2981], [24.6639, 129.6653]] },
  { name: 'JDA K-1-1', type: 'training', alt: 'SFC - FL240', coords: [[34.3928, 137.4781], [34.3939, 137.6031], [34.2317, 137.9358], [34.0364, 138.0208], [33.9925, 138.0147], [33.9472, 137.7603], [34.0628, 137.6875]] },
  { name: 'JDA K-1-2', type: 'training', alt: 'SFC - FL260', coords: [[34.3900, 137.1739], [34.3928, 137.4781], [34.0628, 137.6875], [34.2153, 137.3739], [34.1922, 137.0861], [34.2000, 136.9956]] },
  { name: 'JDA K-1-3', type: 'training', alt: 'SFC - FL310', coords: [[33.7822, 136.6042], [34.2000, 136.9956], [34.1922, 137.0861], [34.2153, 137.3739], [34.0628, 137.6875], [33.9472, 137.7603], [33.8400, 137.1744], [33.8244, 137.0900]] },
  { name: 'JDA K-2', type: 'training', alt: 'SFC - FL240', coords: [[33.9925, 138.0147], [33.1636, 137.9000], [32.9558, 137.2678], [32.9069, 136.7975], [33.5469, 136.3858], [33.7822, 136.6042], [33.8244, 137.0900], [33.8400, 137.1744], [33.9472, 137.7603]] },
  { name: 'Shizuhama', type: 'training', alt: 'SFC - FL240', coords: [[35.1411, 138.6919], [35.1367, 138.5792], [34.8478, 138.2372], [34.8778, 138.7636], [34.8686, 138.7803]] },
  { name: 'HYAKURI Area 1', type: 'training', alt: 'SFC - 5000', coords: [[36.2517, 142.0592], [36.6786, 142.1753], [37.1564, 142.3581], [37.7733, 142.5850], [38.1697, 142.6883], [38.1697, 142.9908], [37.7794, 142.6861], [37.3200, 142.9908], [36.2500, 142.9908]] },
  { name: 'AREA P-1', type: 'training', alt: 'UNL', coords: [[32.0033, 129.5811], [31.3036, 129.5811], [30.3703, 127.9981], [32.5033, 127.1981], [32.5033, 127.4981], [34.0031, 128.6311], [34.3447, 128.9128], [33.8494, 129.3356], [33.8367, 129.3644], [33.1700, 128.9978], [33.0033, 128.4978], [32.3200, 128.4978]] },
  { name: 'AREA G-1', type: 'training', alt: 'UNL', coords: [[40.0025, 135.9964], [39.8358, 135.9967], [39.0525, 136.9969], [39.0028, 136.9969], [38.9197, 137.1633], [38.6889, 137.4739], [38.1958, 137.9969], [38.0697, 137.9969], [36.3961, 134.4503], [36.4267, 133.8633], [36.8336, 133.0878], [36.9500, 133.0778], [37.8844, 132.9972], [38.0028, 132.9972], [40.0025, 135.3261]] },
  { name: 'Area A-1', type: 'training', alt: 'FL600/FL240', coords: [[43.5858, 141.4131], [43.5025, 141.9128], [43.3600, 142.0308], [43.7897, 142.2581], [43.8511, 141.4275]] },
  { name: 'Area A-11', type: 'training', alt: 'FL600/FL240', coords: [[43.3600, 142.0308], [43.2858, 142.0961], [43.0561, 142.2853], [43.2858, 142.6725], [43.4350, 142.9261], [43.7897, 142.2581]] },
  { name: 'Area A-12', type: 'training', alt: 'FL240/FL200', coords: [[43.3600, 142.0308], [43.2858, 142.0961], [43.2858, 142.6725], [43.4350, 142.9261], [43.7897, 142.2581]] },
  { name: 'Area A-13', type: 'training', alt: 'FL600/FL240', coords: [[43.0561, 142.2853], [43.0025, 142.3294], [43.0025, 144.0367], [43.2858, 143.9400], [43.4133, 143.8725], [43.3658, 143.7258], [43.7292, 143.4258], [43.4350, 142.9261], [43.2858, 142.6725]] },
  { name: 'YAUSUBETSU', type: 'restricted', alt: 'GND - 36000', coords: [[43.3414, 144.7069], [43.3281, 144.9014], [43.3025, 145.0306], [43.2303, 145.0325], [43.2217, 144.8708], [43.2928, 144.6694]] },
  { name: 'R-127 OJOJI-HARA', type: 'restricted', alt: 'GND - 25000', coords: [[38.5194, 140.6797], [38.5194, 140.8631], [38.4694, 140.8631], [38.4694, 140.6797]] },
  { name: 'R-129 NORTHERN HONSHU', type: 'restricted', alt: 'SFC - 35000', coords: [[40.8361, 142.1797], [40.8361, 142.9961], [40.7361, 142.9961], [40.4028, 142.5464], [40.4028, 142.2297]] },
  { name: 'R-131 HIDAKAOKI', type: 'restricted', alt: 'SFC - UNL', coords: [[42.0692, 142.2794], [41.7358, 142.9628], [41.4528, 142.7128], [41.7608, 142.0881], [41.9858, 142.0631]] },
  { name: 'R-532', type: 'restricted', alt: 'SFC - 39370', coords: [[38.8531, 142.3631], [38.7364, 142.5297], [38.3531, 142.1631], [38.4697, 141.9964]] },
  { name: 'R-144 ENSHUNADA', type: 'restricted', alt: 'SFC - 49213', coords: [[34.2153, 137.3739], [34.0628, 137.6875], [33.9472, 137.7603], [33.8400, 137.1744], [34.1922, 137.0861]] },
  { name: 'R-121 CENTRAL HONSHU', type: 'restricted', alt: 'SFC - 35000', coords: [[36.6697, 141.0800], [36.6697, 141.3467], [36.0033, 141.3467], [36.0033, 141.0800]] },
  { name: 'R-109 Area LIMA', type: 'restricted', alt: 'SFC - UNL', coords: [[32.0286, 132.6308], [32.1536, 132.9975], [31.8036, 132.9975], [32.0369, 133.4975], [31.7036, 133.4975], [31.0703, 132.1308], [31.4203, 132.1308], [31.6369, 132.6308]] },
  { name: 'R-533', type: 'restricted', alt: 'SFC - UNL', coords: [[31.4203, 132.1308], [31.5119, 132.1558], [32.0036, 132.5808], [32.0536, 132.6308], [31.6369, 132.6308]] },
  { name: 'R-104 Area Golf', type: 'restricted', alt: 'SFC - 20000', coords: [[33.5867, 128.4144], [33.9367, 128.9311], [33.7033, 129.1644], [33.3533, 128.6478]] },
  { name: 'R-105 Area Foxtrot', type: 'restricted', alt: 'SFC - UNL', coords: [[32.3367, 128.7644], [32.3367, 129.1644], [31.7867, 129.1644], [31.7867, 128.7644]] },
  { name: 'R-134 KYUSHU', type: 'restricted', alt: 'SFC - 35000', coords: [[34.8531, 130.5850], [34.7253, 130.8669], [34.1478, 130.4836], [34.2825, 130.2103]] }
];

// =========================================================================
// ジオメトリ計算ヘルパー
// =========================================================================
const toRad = deg => (deg * Math.PI) / 180;
const toDeg = rad => (rad * 180) / Math.PI;

const getBearing = (lat1, lon1, lat2, lon2) => {
  const rLat1 = toRad(lat1); const rLat2 = toRad(lat2); const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(rLat2);
  const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const getDestination = (lat, lon, brng, distNM) => {
  const R = 3440.065; const rLat = toRad(lat); const rLon = toRad(lon); const rBrng = toRad(brng); const dR = distNM / R;
  const rLat2 = Math.asin(Math.sin(rLat) * Math.cos(dR) + Math.cos(rLat) * Math.sin(dR) * Math.cos(rBrng));
  const rLon2 = rLon + Math.atan2(Math.sin(rBrng) * Math.sin(dR) * Math.cos(rLat), Math.cos(dR) - Math.sin(rLat) * Math.sin(rLat2));
  return [toDeg(rLat2), toDeg(rLon2)];
};

const getDistanceNM = (lat1, lon1, lat2, lon2) => {
  const R = 3440.065; const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateOffsetLine = (latlngs, offsetNM) => {
  if (!latlngs || latlngs.length < 2) return [];
  const offsetPoints = [];
  for (let i = 0; i < latlngs.length; i++) {
    let brng;
    if (i === 0) brng = getBearing(latlngs[i][0], latlngs[i][1], latlngs[i + 1][0], latlngs[i + 1][1]);
    else if (i === latlngs.length - 1) brng = getBearing(latlngs[i - 1][0], latlngs[i - 1][1], latlngs[i][0], latlngs[i][1]);
    else {
      const b1 = getBearing(latlngs[i - 1][0], latlngs[i - 1][1], latlngs[i][0], latlngs[i][1]);
      const b2 = getBearing(latlngs[i][0], latlngs[i][1], latlngs[i + 1][0], latlngs[i + 1][1]);
      let diff = b2 - b1;
      if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
      brng = (b1 + diff / 2 + 360) % 360;
    }
    const rightBrng = (brng + 90) % 360;
    offsetPoints.push(getDestination(latlngs[i][0], latlngs[i][1], rightBrng, offsetNM));
  }
  return offsetPoints;
};

const normalizeLongitudes = (latlngs) => {
  if (!latlngs || latlngs.length < 2) return latlngs;
  let offset = 0;
  for (let i = 1; i < latlngs.length; i++) {
    let prevLon = latlngs[i - 1][1];
    let currLon = latlngs[i][1] + offset;
    if (prevLon - currLon > 180) { offset += 360; currLon += 360; }
    else if (currLon - prevLon > 180) { offset -= 360; currLon -= 360; }
    latlngs[i][1] = currLon;
  }
  return latlngs;
};

const parseWaypointToLatLng = (wpObj) => {
  if (!wpObj) return null;
  const wpName = typeof wpObj === 'string' ? wpObj : (wpObj.wp || wpObj.name || '');
  const latLonStr = typeof wpObj === 'string' ? null : wpObj.latLon;

  if (ICAO_COORDS[wpName]) {
    return { lat: ICAO_COORDS[wpName].lat, lon: ICAO_COORDS[wpName].lon, name: wpName, isAirport: true };
  }

  if (latLonStr) {
    const noDot = latLonStr.match(/^([NS])(\d{2})(\d{3})([EW])(\d{3})(\d{3})$/);
    if (noDot) {
      let lat = parseInt(noDot[2], 10) + parseInt(noDot[3], 10) / 600;
      if (noDot[1] === 'S') lat = -lat;
      let lon = parseInt(noDot[5], 10) + parseInt(noDot[6], 10) / 600;
      if (noDot[4] === 'W') lon = -lon;
      return { lat, lon, name: wpName, isAirport: false };
    }
    const dotMatch = latLonStr.match(/^([NS])(\d{2})(\d{2}(?:\.\d+)?)([EW])(\d{2,3})(\d{2}(?:\.\d+)?)$/);
    if (dotMatch) {
      let lat = parseInt(dotMatch[2], 10) + parseFloat(dotMatch[3]) / 60;
      if (dotMatch[1] === 'S') lat = -lat;
      let lon = parseInt(dotMatch[5], 10) + parseFloat(dotMatch[6]) / 60;
      if (dotMatch[4] === 'W') lon = -lon;
      return { lat, lon, name: wpName, isAirport: false };
    }
  }

  const arincMatch = wpName.match(/^(\d{2})([NSWE])(\d{2})$/);
  if (arincMatch) {
    let lat = parseInt(arincMatch[1], 10);
    let lon = parseInt(arincMatch[3], 10);
    const dir = arincMatch[2];
    if (dir === 'N') { lon = -(lon + 100); } else if (dir === 'E') { lon = lon + 100; }
    else if (dir === 'W') { lat = -lat; lon = -(lon + 100); } else if (dir === 'S') { lat = -lat; lon = lon + 100; }
    return { lat, lon, name: wpName, isAirport: false };
  }

  return null;
};

const formatRvTime = (unixTime) => {
  if (!unixTime) return '';
  const d = new Date(unixTime * 1000);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}Z`;
};

const formatJmaTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string' || timeStr.length < 12) return '';
  return `${timeStr.substring(8, 10)}:${timeStr.substring(10, 12)}Z`;
};

// =========================================================================
// CROSS SECTION VIEW
// =========================================================================
const CrossSectionView = ({ routeData, weatherData, timeIndex, showTemp, navlogData }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [activeTooltip, setActiveTooltip] = useState(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeTooltip && !e.target.closest('.wind-barb-group')) {
                setActiveTooltip(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [activeTooltip]);

    if (!routeData || routeData.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-sm bg-slate-950">No Route Data</div>;
    }

    let totalDist = 0;
    const pointsWithDist = routeData.map((wp, idx) => {
        if (idx === 0) return { ...wp, accDist: 0 };
        const prev = routeData[idx - 1];
        const dist = getDistanceNM(prev.lat, prev.lon, wp.lat, wp.lon);
        totalDist += dist;
        return { ...wp, accDist: totalDist };
    });

    const tempLatLngs = routeData.map(pt => [pt.lat, pt.lon]);
    normalizeLongitudes(tempLatLngs);
    const isWestbound = tempLatLngs.length > 1 && (tempLatLngs[tempLatLngs.length - 1][1] < tempLatLngs[0][1]);

    const PADDING_X = 50; const PADDING_Y_TOP = 40; const PADDING_Y_BOTTOM = 60;
    const innerWidth = (dimensions.width * zoomLevel) - PADDING_X * 2;
    const innerHeight = dimensions.height - PADDING_Y_TOP - PADDING_Y_BOTTOM;
    const MAX_FL = 450; const FL_STEP = 20; 

    const getX = (dist) => {
        const normalizedDist = dist / (totalDist || 1);
        if (isWestbound) return PADDING_X + innerWidth - (normalizedDist * innerWidth);
        return PADDING_X + (normalizedDist * innerWidth);
    };
    
    const getY = (fl) => PADDING_Y_TOP + innerHeight - (fl / MAX_FL) * innerHeight;

    const currentWeatherData = weatherData[timeIndex] || {};

    const drawWindBarb = (wp, idx, fl, x, y, windData) => {
        if (!windData || windData.ws === undefined) return null;
        const { wd, ws, temp } = windData;
        const tooltipId = `${wp.name}-${idx}-${fl}`;
        const isTooltipActive = activeTooltip === tooltipId;

        if (ws < 5) return (
            <g key={`wind-${tooltipId}`} transform={`translate(${x},${y})`} 
               className="wind-barb-group cursor-pointer"
               onClick={(e) => { e.stopPropagation(); setActiveTooltip(isTooltipActive ? null : tooltipId); }}>
                <circle r="15" fill="transparent" /> 
                <circle r="2" fill="#94a3b8" />
                {isTooltipActive && (
                    <g className="z-50 pointer-events-none">
                        <rect x="10" y="-30" width="80" height="40" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="4" opacity="0.95" />
                        <text x="15" y="-15" fontSize="10" fill="#e0f2fe" fontWeight="bold">FL{String(fl).padStart(3, '0')}</text>
                        <text x="15" y="-3" fontSize="10" fill="#bae6fd">CALM</text>
                        <text x="65" y="-15" fontSize="10" fill="#fca5a5">{temp > 0 ? '+' : ''}{temp}℃</text>
                    </g>
                )}
            </g>
        ); 

        const length = 20; 
        const speed = Math.round(ws);
        const num50 = Math.floor(speed / 50);
        const rem50 = speed % 50;
        const num10 = Math.floor(rem50 / 10);
        const rem10 = rem50 % 10;
        const num5 = Math.floor(rem10 / 5);

        let currentY = -length;
        const barbElements = [];

        for (let i = 0; i < num50; i++) {
            barbElements.push(<polygon key={`50-${i}`} points={`0,${currentY} 8,${currentY} 0,${currentY+4}`} fill="#e2e8f0" />);
            currentY += 5;
        }
        for (let i = 0; i < num10; i++) {
            barbElements.push(<line key={`10-${i}`} x1="0" y1={currentY} x2="8" y2={currentY - 3} stroke="#e2e8f0" strokeWidth="1.5" />);
            currentY += 4;
        }
        if (num5 > 0) {
            if (num50 === 0 && num10 === 0) currentY += 3;
            barbElements.push(<line key={`5`} x1="0" y1={currentY} x2="4" y2={currentY - 1.5} stroke="#e2e8f0" strokeWidth="1.5" />);
        }

        return (
            <g key={`wind-${tooltipId}`} transform={`translate(${x},${y})`} 
               className="wind-barb-group cursor-pointer group"
               onClick={(e) => { e.stopPropagation(); setActiveTooltip(isTooltipActive ? null : tooltipId); }}>
                <circle r="15" fill="transparent" />
                <g transform={`rotate(${wd})`}>
                    <line x1="0" y1="0" x2="0" y2={-length} stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    {barbElements}
                </g>
                <g className={`transition-opacity z-50 pointer-events-none ${isTooltipActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <rect x="10" y="-30" width="80" height="40" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="4" opacity="0.95" />
                    <text x="15" y="-15" fontSize="10" fill="#e0f2fe" fontWeight="bold">FL{String(fl).padStart(3, '0')}</text>
                    <text x="15" y="-3" fontSize="10" fill="#bae6fd">{wd}° / {speed}kt</text>
                    <text x="65" y="-15" fontSize="10" fill="#fca5a5">{temp > 0 ? '+' : ''}{temp}℃</text>
                </g>
            </g>
        );
    };

    const windArrows = []; const shearRects = []; const windSpeedGrid = []; const tempGrid = [];

    for (let fl = 0; fl <= MAX_FL; fl += FL_STEP) {
        const rowWs = []; const rowTemp = [];
        pointsWithDist.forEach(wp => {
            const wData = (currentWeatherData[wp.name] || {})[fl];
            rowWs.push(wData ? wData.ws : 0);
            rowTemp.push(wData ? wData.temp : 0);
        });
        windSpeedGrid.push(rowWs);
        tempGrid.push(rowTemp);
    }

    for (let i = 0; i < pointsWithDist.length - 1; i++) {
        const wp = pointsWithDist[i];
        const nextWp = pointsWithDist[i+1];
        const wpWeather = currentWeatherData[wp.name] || {};
        
        const rawX1 = getX(wp.accDist); const rawX2 = getX(nextWp.accDist);
        const rectX = Math.min(rawX1, rawX2);
        const cellWidth = Math.abs(rawX2 - rawX1);

        for (let fl = 0; fl <= MAX_FL; fl += FL_STEP) {
            const wind = wpWeather[fl];
            const windUpper = wpWeather[fl + FL_STEP];
            const y = getY(fl); const yUpper = getY(fl + FL_STEP);
            const cellHeight = Math.abs(yUpper - y);

            if (wind) {
                if (!wp.isSpecialWp) {
                    windArrows.push(drawWindBarb(wp, i, fl, rawX1, y, wind));
                }
                if (windUpper) {
                    const u1 = -wind.ws * Math.sin(toRad(wind.wd)); const v1 = -wind.ws * Math.cos(toRad(wind.wd));
                    const u2 = -windUpper.ws * Math.sin(toRad(windUpper.wd)); const v2 = -windUpper.ws * Math.cos(toRad(windUpper.wd));
                    const vectorShear = Math.sqrt((u2-u1)**2 + (v2-v1)**2);
                    const shearPer1000ft = vectorShear / (FL_STEP / 10);
                    let shearColor = null, opacity = 0;
                    if (shearPer1000ft >= 6) { shearColor = '#ef4444'; opacity = 0.5; }
                    else if (shearPer1000ft >= 4) { shearColor = '#eab308'; opacity = 0.3; }
                    else if (shearPer1000ft >= 2) { shearColor = '#22c55e'; opacity = 0.15; }

                    if (shearColor) shearRects.push(<rect key={`shear-${wp.name}-${i}-${fl}`} x={rectX} y={yUpper} width={cellWidth} height={cellHeight} fill={shearColor} opacity={opacity} />);
                }
            }
        }
    }
    
    const lastWpIdx = pointsWithDist.length - 1;
    const lastWp = pointsWithDist[lastWpIdx];
    const lastWpWeather = currentWeatherData[lastWp.name] || {};
    const lastX = getX(lastWp.accDist);
    for (let fl = 0; fl <= MAX_FL; fl += FL_STEP) {
        if (lastWpWeather[fl]) {
            if (!lastWp.isSpecialWp) {
                windArrows.push(drawWindBarb(lastWp, lastWpIdx, fl, lastX, getY(fl), lastWpWeather[fl]));
            }
        }
    }

    const drawIsoline = (grid, threshold, isTemp = false) => {
        let pathData = ""; const lines = []; 
        for (let r = 0; r < grid.length - 1; r++) {
            for (let c = 0; c < grid[r].length - 1; c++) {
                const x1 = getX(pointsWithDist[c].accDist), x2 = getX(pointsWithDist[c+1].accDist);
                const y1 = getY(r * FL_STEP), y2 = getY((r + 1) * FL_STEP);
                const v0 = grid[r][c], v1 = grid[r][c+1], v2 = grid[r+1][c+1], v3 = grid[r+1][c];
                
                const check = (val) => isTemp ? val <= threshold : val >= threshold;
                let cellType = (check(v0) ? 1 : 0) | (check(v1) ? 2 : 0) | (check(v2) ? 4 : 0) | (check(v3) ? 8 : 0);

                if (cellType === 0 || cellType === 15) continue;
                const interp = (valA, valB, posA, posB) => posA + (posB - posA) * ((threshold - valA) / (valB - valA || 1));
                let p = [];
                if ((cellType & 1) !== ((cellType & 2) >> 1)) p.push([interp(v0, v1, x1, x2), y1]);
                if (((cellType & 2) >> 1) !== ((cellType & 4) >> 2)) p.push([x2, interp(v1, v2, y1, y2)]);
                if (((cellType & 8) >> 3) !== ((cellType & 4) >> 2)) p.push([interp(v3, v2, x1, x2), y2]);
                if ((cellType & 1) !== ((cellType & 8) >> 3)) p.push([x1, interp(v0, v3, y1, y2)]);

                if (p.length === 2) {
                    pathData += `M ${p[0][0]},${p[0][1]} L ${p[1][0]},${p[1][1]} `;
                    lines.push({ x: (p[0][0]+p[1][0])/2, y: (p[0][1]+p[1][1])/2 });
                } else if (p.length === 4) {
                     pathData += `M ${p[0][0]},${p[0][1]} L ${p[1][0]},${p[1][1]} M ${p[2][0]},${p[2][1]} L ${p[3][0]},${p[3][1]} `;
                }
            }
        }
        return { path: pathData, labelPts: lines };
    };

    const isotachLines = [];
    [40, 60, 80, 100, 120, 140, 160, 180, 200].forEach(speed => {
        const { path, labelPts } = drawIsoline(windSpeedGrid, speed);
        if (path) {
            isotachLines.push(<path key={`iso-${speed}`} d={path} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />);
            labelPts.filter((_, idx) => idx % 10 === 0).forEach((pt, idx) => {
                 isotachLines.push(<text key={`iso-lbl-${speed}-${idx}`} x={pt.x} y={pt.y} fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" className="bg-slate-900">{speed}</text>);
            });
        }
    });

    const isothermLines = [];
    if (showTemp) {
        for (let temp = 30; temp >= -70; temp -= 10) {
            const { path, labelPts } = drawIsoline(tempGrid, temp, true);
            if (path) {
                const isZero = temp === 0;
                const strokeColor = isZero ? '#ef4444' : (temp > 0 ? '#f43f5e' : '#fb7185');
                const strokeWidth = isZero ? "2" : "1.5";
                const dashArray = isZero ? "" : "5 5";
                const opacity = isZero ? "1" : "0.7";
                
                isothermLines.push(<path key={`temp-${temp}`} d={path} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dashArray} opacity={opacity} />);
                labelPts.filter((_, idx) => idx % 15 === 0).forEach((pt, idx) => {
                     isothermLines.push(<text key={`temp-lbl-${temp}-${idx}`} x={pt.x} y={pt.y} fill={strokeColor} fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{temp > 0 ? `+${temp}` : temp}</text>);
                });
            }
        }
    }

    const timeMarkers = [];
    if (pointsWithDist.length > 0 && navlogData && navlogData.stdH !== undefined && navlogData.stdM !== undefined) {
        try {
            const startMins = navlogData.stdH * 60 + navlogData.stdM;
            const lastWp = pointsWithDist[pointsWithDist.length - 1];
            const endCtme = lastWp.ctme || 0;

            let firstHourMins = Math.ceil(startMins / 60) * 60;
            
            for (let t = firstHourMins; t <= startMins + endCtme; t += 60) {
                const elapsedFromDep = t - startMins;
                
                let prevWp = null;
                let nextWp = null;
                for (let i = 0; i < pointsWithDist.length; i++) {
                    if (pointsWithDist[i].ctme <= elapsedFromDep) prevWp = pointsWithDist[i];
                    if (pointsWithDist[i].ctme > elapsedFromDep && !nextWp) nextWp = pointsWithDist[i];
                }

                if (prevWp && nextWp && nextWp.ctme > prevWp.ctme) {
                    const ratio = (elapsedFromDep - prevWp.ctme) / (nextWp.ctme - prevWp.ctme);
                    const distAtT = prevWp.accDist + (nextWp.accDist - prevWp.accDist) * ratio;
                    const xAtT = getX(distAtT);

                    const displayHour = Math.floor(t / 60) % 24;
                    const timeStrLabel = `${String(displayHour).padStart(2, '0')}:00Z`;

                    timeMarkers.push(
                        <g key={`time-marker-${t}`}>
                            <line x1={xAtT} y1={PADDING_Y_TOP} x2={xAtT} y2={innerHeight + PADDING_Y_TOP} stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                            <rect x={xAtT - 18} y={PADDING_Y_TOP - 20} width="36" height="14" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                            <text x={xAtT} y={PADDING_Y_TOP - 10} fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">{timeStrLabel}</text>
                        </g>
                    );
                }
            }
        } catch (error) {
            console.error("Z-time marker rendering error:", error);
        }
    }

    const hasTOC = pointsWithDist.some(wp => wp.name === 'TOC');
    const hasTOD = pointsWithDist.some(wp => wp.name === 'TOD');
    let profilePts = [];

    const cruiseFL = Math.min(Math.max(...pointsWithDist.map(w => w.fl || 0)), 450) || 350;

    if (hasTOC && hasTOD) {
        profilePts.push(`${getX(pointsWithDist[0].accDist)},${getY(0)}`);
        
        let isCruising = false;
        let isDescending = false;
        
        pointsWithDist.forEach((wp, idx) => {
            if (wp.name === 'TOC') isCruising = true;
            
            if (isCruising) {
                let validFl = wp.fl;
                if (!validFl || validFl < 100 || validFl > 450) {
                    validFl = cruiseFL;
                }
                profilePts.push(`${getX(wp.accDist)},${getY(validFl)}`);
            }
            
            if (wp.name === 'TOD') {
                isCruising = false;
                isDescending = true;
            }
        });
        
        profilePts.push(`${getX(pointsWithDist[pointsWithDist.length - 1].accDist)},${getY(0)}`);
    } else {
        pointsWithDist.forEach((wp, idx) => {
            let currentFL = wp.fl || 0;
            if (idx === 0 || idx === pointsWithDist.length - 1) currentFL = 0;
            
            if (!hasTOC && wp.accDist < 100 && idx !== 0) {
                 currentFL = cruiseFL * (wp.accDist / 100);
            }
            if (!hasTOD && wp.accDist > totalDist - 100 && idx !== pointsWithDist.length - 1) {
                 currentFL = cruiseFL * ((totalDist - wp.accDist) / 100);
            }
            if (idx !== 0 && idx !== pointsWithDist.length - 1 && (currentFL === 0 || currentFL < 100)) {
                 currentFL = cruiseFL;
            }

            profilePts.push(`${getX(wp.accDist)},${getY(currentFL)}`);
        });
    }

    const profilePath = profilePts.join(' L ');

    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSensitivity = 0.02;
            let delta = e.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
            setZoomLevel(prevZoom => Math.max(1, Math.min(5, prevZoom + delta)));
        } else {
            if (e.deltaX !== 0 || e.shiftKey) {
                if (containerRef.current) {
                    containerRef.current.scrollLeft += e.deltaX || e.deltaY;
                    e.preventDefault();
                }
            }
        }
    };
    
    let pinchStartDist = 0;
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            pinchStartDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
    };
    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && pinchStartDist > 0) {
            e.preventDefault();
            const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            const delta = (currentDist - pinchStartDist) * 0.01;
            setZoomLevel(prevZoom => Math.max(1, Math.min(5, prevZoom + delta)));
            pinchStartDist = currentDist;
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 relative">
            <div className="absolute top-2 right-4 z-10 flex gap-2">
                <div className="bg-slate-900/80 border border-slate-700 rounded px-2 py-1 flex items-center gap-2 backdrop-blur">
                    <span className="text-xs font-bold text-slate-400">ZOOM:</span>
                    <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} className="text-sky-400 hover:text-white px-2 bg-slate-800 rounded text-lg leading-none">-</button>
                    <span className="text-xs text-white w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.5))} className="text-sky-400 hover:text-white px-2 bg-slate-800 rounded text-lg leading-none">+</button>
                </div>
            </div>

            <div className="absolute top-2 left-4 z-10 bg-slate-900/80 border border-slate-700 rounded p-2 backdrop-blur text-[10px] text-slate-300 pointer-events-none">
                <div className="font-bold text-sky-400 border-b border-slate-700 mb-1 pb-1">Turbulence (Vertical Shear)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 opacity-50 inline-block"></span> SEVERE (≥ 6kt/1000ft)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500 opacity-50 inline-block"></span> MODERATE (≥ 4kt/1000ft)</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 opacity-50 inline-block"></span> LIGHT (≥ 2kt/1000ft)</div>
            </div>

            <div 
                className="flex-1 overflow-x-auto overflow-y-hidden relative touch-pan-x" 
                ref={containerRef}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
            >
                <div style={{ width: Math.max(dimensions.width, innerWidth + PADDING_X * 2), height: '100%' }}>
                    <svg width="100%" height="100%" className="block select-none">
                        {[0, 100, 200, 300, 400].map(fl => (
                            <g key={`grid-fl-${fl}`}>
                                <line x1={PADDING_X} y1={getY(fl)} x2={PADDING_X + innerWidth} y2={getY(fl)} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                                <text x={PADDING_X - 5} y={getY(fl) + 3} fill="#64748b" fontSize="10" textAnchor="end">FL{String(fl).padStart(3, '0')}</text>
                            </g>
                        ))}
                        {timeMarkers}
                        <g style={{ filter: 'blur(8px)' }}>{shearRects}</g>
                        <g>{isotachLines}</g>
                        <g>{isothermLines}</g>
                        <g>{windArrows}</g>
                        
                        <path d={`M ${profilePath}`} fill="none" stroke="#d946ef" strokeWidth="2.5" />
                        
                        {pointsWithDist.map((wp, idx) => {
                            if (wp.isSpecialWp || wp.isClimbOrDescent) return null;
                            
                            const displayFl = (wp.fl && wp.fl > 0 && wp.fl <= 450) ? wp.fl : cruiseFL;
                            if (idx === 0 || idx === pointsWithDist.length - 1) return (
                                <g key={`wp-${idx}`} transform={`translate(${getX(wp.accDist)}, ${innerHeight + PADDING_Y_TOP})`}>
                                    <line x1="0" y1="0" x2="0" y2="5" stroke="#94a3b8" strokeWidth="1" />
                                    <text x="0" y="20" fill="#e2e8f0" fontSize="10" textAnchor="middle" transform="rotate(45, 0, 20)">{wp.name}</text>
                                    <circle cx="0" cy="0" r="3.5" fill="#fdf4ff" stroke="#d946ef" strokeWidth="2" />
                                </g>
                            );

                            return (
                            <g key={`wp-${idx}`} transform={`translate(${getX(wp.accDist)}, ${innerHeight + PADDING_Y_TOP})`}>
                                <line x1="0" y1="0" x2="0" y2="5" stroke="#94a3b8" strokeWidth="1" />
                                <text x="0" y="20" fill="#e2e8f0" fontSize="10" textAnchor="middle" transform="rotate(45, 0, 20)">{wp.name}</text>
                                <circle cx="0" cy={-(innerHeight * (displayFl / MAX_FL))} r="3.5" fill="#fdf4ff" stroke="#d946ef" strokeWidth="2" />
                            </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
};

// =========================================================================
// FIR境界データ (VATSPY Boundaries.geojson) の前処理
// -------------------------------------------------------------------------
// 上流データの現行スキーマ (2026-11 確認):
//   properties = { id, oceanic ('0'/'1'), label_lon, label_lat, region, division }
//   - name プロパティは存在しない (名称表示は ICAO コードで行う)
//   - 1つのFIRは「素のIDの完全な境界ポリゴン」と「ID-XXX 形式のセクタ分割」の
//     両方を含むことがある。素のポリゴンがある場合はそれがFIR全体の境界。
//     無い場合はセクタ同士の共有辺を相殺して外周だけを残す。
//   - 同一ジオメトリの重複登録がある (例: NZOH が2件) ため重複除去が必須。
// 処理結果はモジュールスコープにキャッシュし、表示ON/OFFのたびに
// 2MB超のGeoJSONを再取得・再計算しないようにする。
//
// updated4 での修正 (いずれも updated5 でも維持):
//   - 経度180°の継ぎ目に立つ人工的な縦線 (両端とも |lon|>=179.9 のセグメント) を除去。
//   - カナダ上空の幻の三角形 (CZEG/CZWG のポリゴン重なり) が出ないこと。
//
// updated5 での変更: 国統合を全ての国に一般化した。
//   - updated4 までは米・中・豪・露・加の5か国だけが国統合の対象で、しかも
//     中国では内部に FIR 同士の境界線が残っていた。全ての国について
//     「その国の FIR ポリゴンの和集合 (ユニオン) の外枠だけ」を描く。
//   - FIR→国の対応付けは ICAO 位置指示子の接頭辞 (国ごとに割当) を主規則とし、
//     division (VATSIM 管区) が国単位の範囲では全て一致することを確認した。
//     region は大陸圏、division は複数国にまたがる管区があるため国判定には
//     使えない。例外と合同セクタの扱いは firCountryOf のコメント参照。
//     同じ国に FIR が1つだけの国は従来通り個別表示 (ラベル付き)。
//   - 外枠の作り方も変更した。従来の「共有辺の相殺」は、同じ国の FIR が
//     タイル状に接するデータでしか機能しない。実データには国全体のポリゴンを
//     少しずつ違う内部区分で複製したものがあり (ドイツ EDXX は EDGG の辺の
//     89% を共有する)、相殺すると国境そのものが消えてしまう。またセクタ同士が
//     大きく重なる国 (オーストラリア等) では内部線が大量に残る。そこで辺ごとに
//     「辺上のサンプル点の両側 (±0.5°) が同国の FIR ポリゴンの内側にあるか」を
//     直接判定し、内側にある辺だけを落とす方式にした (firUnionCountryOutline)。
//     最後に、中点の両側がユニオン内側になる辺が残らないよう分割除去する
//     (firSplitForUnionAudit)。検証では全ての統合国で内部セグメント 0。
//   - 統合された国の FIR には個別ラベルを付けないため、ラベル総数は
//     updated4 の 281 から 110 に減る (個別表示の FIR 分のみ)。
//
// updated6 での変更: updated5 (国別 FIR アウトライン) に POLAR レイヤーを統合。
//   - POLAR は極軌道衛星 Metop の AVHRR 赤外 (IR10.8) を EUMETSAT WMS
//     (eps:m01_ir108 / eps:m02_ir108 / eps:m03_ir108 の3機分を重ね描き) で
//     表示するレイヤーで、グリーンランド等の高緯度域の雲を見るためのもの。
//   - FIR 処理 (processFirData) は updated5 から一切変更していない。
//
// updated7 での変更: POLAR の「全体が白くなる」問題の修正 (updated6 からの差分は POLAR のみ)。
//   実測: EUMETSAT WMS の eps:m0X_ir108 は透過指定を無視するのではなく、Metop の
//   モザイク自体がほぼ全面を不透明に覆う (グリーンランド域で m01/m03 は不透明率
//   100%、平均輝度 約190/255 と真っ白に近い)。デフォルト ON・範囲無制限でカラーの
//   GEO 画像の上に 0.85 で重ねていたため、地図全体が白く霞んでいた。
//   修正: (1) POLAR の表示範囲を北緯58°以北に限定 (GEO レイヤーと同様に bounds で
//   クリップ)、(2) デフォルト OFF に変更。用がある高緯度でのみ ON にして使う。
//   CSS の mix-blend-mode (multiply/screen) は合成テストで雲の判読性がむしろ
//   落ちることを確認したため採用していない。FIR 処理は updated6 から無変更。
// =========================================================================
const FIR_DATA_URL = 'https://cdn.jsdelivr.net/gh/vatsimnetwork/vatspy-data-project@master/Boundaries.geojson';
let firProcessedCache = null;
let firFetchPromise = null;

const firBaseId = (id) => (id || '').split('-')[0];

// FIR → 国の対応付け (updated5 で全ての国に一般化)。
// 上流データの region は大陸圏 (EMEA/APAC/AMAS)、division は VATSIM の
// 管区 (VATEUD=欧州全域、VATWA=インド周辺など) で、どちらも国単位では
// ない。国の単位は「ICAO 位置指示子の接頭辞は国 (加盟国) ごとに割り当て
// られる」ことに基づく。division が国単位の範囲 (VATPRC=中国、VATWA=
// インド VA/VE/VI/VO、VATROC=台湾 RC、VATJPN、VATKOR...) では、接頭辞
// による国判定と全て一致することを確認した。
// 例外 (接頭辞だけでは決まらないもの):
//   UMKK (カリーニングラード) はロシア、UTDD (ドゥシャンベ) はタジキ
//   スタン、TEH (テヘラン) はイラン、UKR はウクライナ、XVCL はベトナム、
//   BAIRES (ブエノスアイレス) はアルゼンチン。
//   ZM (モンゴル) と ZK (北朝鮮) はそれぞれ独立した国で、中国ではない
//   (updated4 までは中国のバケツに誤って含まれていた)。
//   NAT (北大西洋トラック域) / ADR (アドリア海合同セクタ) / GUY (ギアナ
//   合同セクタ) は国の FIR ではない (合同セクタは複数国の FIR と重なる)
//   ため統合対象外とし、従来通り個別表示にする。
const FIR_NO_COUNTRY = new Set(['NAT', 'ADR', 'GUY']);
const FIR_COUNTRY_OVERRIDES = { BAIRES: 'Argentina', TEH: 'Iran', UKR: 'Ukraine', UMKK: 'Russia', UTDD: 'Tajikistan', XVCL: 'Vietnam' };
// 複数の接頭辞にまたがる国 (VH は香港 = 中国として扱う)
const FIR_MULTI_PREFIX_COUNTRIES = [
  ['China', ['ZB', 'ZG', 'ZH', 'ZJ', 'ZL', 'ZP', 'ZS', 'ZU', 'ZW', 'ZY', 'VH']],
  ['India', ['VA', 'VE', 'VI', 'VO']],
  ['Russia', ['UE', 'UH', 'UI', 'UL', 'UN', 'UR', 'US', 'UU', 'UW']],
  ['United States', ['PA', 'PG', 'PH', 'TJ']],
  ['Spain', ['LE', 'GC']],
  ['Malaysia', ['WB', 'WM']],
  ['Indonesia', ['WA', 'WI']],
];
// 接頭辞→国名 (同一接頭辞内に複数の FIR がある国)
const FIR_PREFIX_COUNTRY_NAMES = { LF: 'France', ED: 'Germany', EG: 'United Kingdom', EN: 'Norway', ES: 'Sweden', LI: 'Italy', LS: 'Switzerland', LT: 'Turkey', LL: 'Israel', LG: 'Greece', EI: 'Ireland', LP: 'Portugal', SA: 'Argentina', SB: 'Brazil', SC: 'Chile', SK: 'Colombia', MM: 'Mexico', NZ: 'New Zealand', FA: 'South Africa', OE: 'Saudi Arabia', OP: 'Pakistan', UK: 'Ukraine', UA: 'Kazakhstan', UC: 'Kyrgyzstan', UZ: 'Uzbekistan', UT: 'Turkmenistan', UM: 'Belarus', RJ: 'Japan', RK: 'South Korea', VV: 'Vietnam', DG: 'Ghana', DN: 'Nigeria', GM: 'Morocco', GO: 'Senegal', FQ: 'Mozambique', NF: 'Fiji', NT: 'French Polynesia', TT: 'Trinidad and Tobago' };
// FIR (素ID) の所属国 (表示用の国名)。国の FIR でない場合は null。
// 同じ国に FIR が1つだけの場合は呼び出し側で個別表示にする。
const firCountryOf = (base) => {
  if (!base) return null;
  if (FIR_NO_COUNTRY.has(base)) return null;
  if (FIR_COUNTRY_OVERRIDES[base]) return FIR_COUNTRY_OVERRIDES[base];
  if (base.startsWith('K')) return 'United States';
  if (base.startsWith('C')) return 'Canada';
  if (base.startsWith('Y')) return 'Australia';
  const p2 = base.slice(0, 2);
  for (const [name, prefs] of FIR_MULTI_PREFIX_COUNTRIES) if (prefs.includes(p2)) return name;
  if (FIR_PREFIX_COUNTRY_NAMES[p2]) return FIR_PREFIX_COUNTRY_NAMES[p2];
  return p2; // それ以外の接頭辞は ICAO の国別割当そのもの (単独国のグループキー)
};

const firRingsOf = (feature) => {
  const g = feature?.geometry;
  if (!g) return [];
  if (g.type === 'Polygon') return g.coordinates || [];
  if (g.type === 'MultiPolygon') return (g.coordinates || []).flat();
  return [];
};

// 日付変更線をまたぐリングを、経度が連続する形に展開する
const firUnwrapRing = (ring) => {
  const out = [];
  let offset = 0;
  ring.forEach((pt, i) => {
    let lon = pt[0] + offset;
    if (i > 0) {
      const prevLon = out[i - 1][0];
      if (lon - prevLon > 180) { offset -= 360; lon -= 360; }
      else if (prevLon - lon > 180) { offset += 360; lon += 360; }
    }
    out.push([lon, pt[1]]);
  });
  return out;
};

const firRingSegments = (ring) => {
  const pts = firUnwrapRing(ring);
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i][0] === pts[i + 1][0] && pts[i][1] === pts[i + 1][1]) continue;
    segs.push([pts[i], pts[i + 1]]);
  }
  return segs;
};

const firFeatureSegments = (feature) => {
  const segs = [];
  firRingsOf(feature).forEach(r => { segs.push(...firRingSegments(r)); });
  return segs;
};

// セグメント群のうち、複数の図形で共有されている辺 (count>=2) を取り除き、
// 外周だけを残す。端点キーは小数2位に丸めて、隣接図形間の微小な座標差を吸収する。
const firCancelSharedEdges = (segmentLists) => {
  const edgeCount = new Map();
  segmentLists.forEach(segs => {
    segs.forEach(([p1, p2]) => {
      const k1 = `${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
      const k2 = `${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
      if (k1 === k2) return;
      const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
      const cur = edgeCount.get(key);
      if (cur) cur.count++;
      else edgeCount.set(key, { p1, p2, count: 1 });
    });
  });
  const out = [];
  edgeCount.forEach(v => { if (v.count === 1) out.push([v.p1, v.p2]); });
  return out;
};

// 1つのFIR (素IDでグループ化された図形群) の外周セグメントを返す
const firOutlineForGroup = (base, pieces) => {
  const seen = new Set();
  const uniq = [];
  pieces.forEach(f => {
    const sig = JSON.stringify(f.geometry);
    if (seen.has(sig)) return;
    seen.add(sig);
    uniq.push(f);
  });
  // 素のポリゴンがあれば、それ自体がFIR全体の境界 (セクタはその内部分割)
  const bare = uniq.find(f => f.properties?.id === base);
  if (bare) return firFeatureSegments(bare);
  const outline = firCancelSharedEdges(uniq.map(firFeatureSegments));
  if (outline.length > 0) return outline;
  // セクタが入れ子状に重なり全辺が相殺された場合は、最大の図形の境界で代用する (例: TEH)
  let largest = null;
  let largestVerts = -1;
  uniq.forEach(f => {
    const n = firRingsOf(f).reduce((a, r) => a + r.length, 0);
    if (n > largestVerts) { largestVerts = n; largest = f; }
  });
  return largest ? firFeatureSegments(largest) : [];
};

// 経度180°の継ぎ目そのものに立つセグメント (元ポリゴンの継ぎ目頂点同士を結ぶ
// 人工的な縦線) かどうか。日付変更線をまたぐ正当な境界は、少なくとも一方の
// 端点が 180 から離れているため、ここでは除去されない。
const firIsSeamSegment = ([p1, p2]) =>
  Math.abs(p1[0]) >= 179.9 && Math.abs(p2[0]) >= 179.9 && Math.abs(p2[1] - p1[1]) > 0;

const firSegPointDist = (pt, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  let t = L2 === 0 ? 0 : ((pt[0] - a[0]) * dx + (pt[1] - a[1]) * dy) / L2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(pt[0] - (a[0] + t * dx), pt[1] - (a[1] + t * dy));
};

// セグメントの中点から法線方向に off° ずらした両側の点
const firSegSidePoints = ([p1, p2], off) => {
  const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  return [[mx + nx * off, my + ny * off], [mx - nx * off, my - ny * off]];
};

// 外周を、相手メンバーと共有する頂点 (ジャンクション) 同士を結ぶ弧に分解する
// セグメント上の点 c から法線方向に off° ずらした両側の点
const firVKey = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const firSKey = ([a, b]) => {
  const k1 = firVKey(a), k2 = firVKey(b);
  return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
};

const firSidePointsAt = ([p1, p2], c, off) => {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  return [[c[0] + nx * off, c[1] + ny * off], [c[0] - nx * off, c[1] - ny * off]];
};
const firSegMid = ([p1, p2]) => [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
// 点がリングの内側にあるか (リングの代表点付近の経度フレームで判定する
// ことで、経度180°をまたぐリングでも正しく判定できる)
const firPointInRingNear = (ring, pt) => {
  const px = pt[0] + Math.round((ring[0][0] - pt[0]) / 360) * 360;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > pt[1]) !== (yj > pt[1]) && px < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
// バケット (国) メンバーの元ポリゴンを内外判定用に準備する
const firPrepMemberPieces = (member) => {
  const pieces = [];
  member.pieces.forEach(f => {
    firRingsOf(f).forEach(ring => {
      if (ring.length < 3) return;
      let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      ring.forEach(([x, y]) => { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; });
      pieces.push({ ring, bbox: [minx, miny, maxx, maxy] });
    });
  });
  return { pieces, outline: member.outline };
};
// 点がメンバーの内側に「厳密に」あるか。そのメンバーの輪郭線から
// 0.05° 以上離れている場合のみ true にし、国境線の食い違い
// (二重線の隙間など) を内側と誤判定しないようにする。
const firPointStrictlyInMember = (prep, pt) => {
  let inside = false;
  for (const p of prep.pieces) {
    const px = pt[0] + Math.round((p.ring[0][0] - pt[0]) / 360) * 360;
    const b = p.bbox;
    if (px < b[0] - 0.001 || px > b[2] + 0.001 || pt[1] < b[1] - 0.001 || pt[1] > b[3] + 0.001) continue;
    if (firPointInRingNear(p.ring, pt)) { inside = true; break; }
  }
  if (!inside) return false;
  for (const [a, b] of prep.outline) {
    const ax = a[0] + Math.round((pt[0] - a[0]) / 360) * 360;
    const bx = b[0] + Math.round((pt[0] - b[0]) / 360) * 360;
    if (firSegPointDist(pt, [ax, a[1]], [bx, b[1]]) <= 0.05) return false;
  }
  return true;
};
// 点がピース群の内側にあるか (ガードなし。監査条件の再現用)
const firPointInPiecesPlain = (pieces, pt) =>
  pieces.some(f => firRingsOf(f).some(ring => ring.length >= 3 && firPointInRingNear(ring, pt)));

// 国の外枠 (ユニオン輪郭) を作る。
// updated4 までの「共有辺の相殺」は、同じ国の FIR 同士で境界が完全に
// 一致するタイル状データでしか機能しない。実データには
//   (1) 国全体のポリゴンを少しずつ違う内部区分で複製したもの
//       (ドイツ EDXX は EDGG の辺の 89% を共有する。国境そのものが
//        相殺されて枠が消えてしまう)
//   (2) セクタ同士が大きく重なる国 (オーストラリアなど)
// があり、相殺では国毎の枠にならない。そこで辺ごとに「その辺が国の
// ユニオンの内側にあるか」を直接判定する: 辺上の複数サンプル点の
// 両側 (±0.5°) が全て同国の FIR ポリゴンの内側にあれば内部線として
// 落とし、片側でも外側に出るサンプルがあれば外枠として残す。
// タイル状の共有辺もこの判定で内部線になるため、相殺は不要になる。
const firUnionCountryOutline = (members) => {
  const preps = members.map(m => firPrepMemberPieces(m));
  const insideUnion = (pt) => preps.some(prep => firPointStrictlyInMember(prep, pt));
  const segIsInternal = (seg) => {
    const len = Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]);
    const n = Math.max(1, Math.min(8, Math.ceil(len / 1.5)));
    const ts = new Set([0.5]);
    for (let i = 0; i < n; i++) ts.add((i + 0.5) / n);
    for (const t of ts) {
      const c = [seg[0][0] + (seg[1][0] - seg[0][0]) * t, seg[0][1] + (seg[1][1] - seg[0][1]) * t];
      const [s1, s2] = firSidePointsAt(seg, c, 0.5);
      if (!insideUnion(s1) || !insideUnion(s2)) return false;
    }
    return true;
  };
  const segMap = new Map();
  members.forEach(m => m.outline.forEach(([a, b]) => {
    const k = firSKey([a, b]);
    if (!segMap.has(k)) segMap.set(k, [a, b]);
  }));
  const out = [];
  segMap.forEach(seg => { if (!segIsInternal(seg)) out.push(seg); });
  return out;
};
// 残った辺のうち「中点の両側 (±0.5°) がユニオン内側」という監査条件に
// 抵触するものを、分割して抵触部分だけ落とす。長い国境辺が中点付近
// だけ別の FIR に覆われている場合に、辺全体を失わずに済む。
const firSplitForUnionAudit = (members, outline) => {
  const pieces = members.flatMap(m => m.pieces);
  const flagged = (seg) => {
    const [s1, s2] = firSegSidePoints(seg, 0.5);
    return firPointInPiecesPlain(pieces, s1) && firPointInPiecesPlain(pieces, s2);
  };
  const out = [];
  const stack = outline.map(seg => ({ seg, depth: 0 }));
  while (stack.length) {
    const { seg, depth } = stack.pop();
    if (!flagged(seg)) { out.push(seg); continue; }
    const len = Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]);
    if (depth >= 6 || len < 0.35) continue;
    const mid = firSegMid(seg);
    stack.push({ seg: [seg[0], mid], depth: depth + 1 }, { seg: [mid, seg[1]], depth: depth + 1 });
  }
  return out;
};

const processFirData = (rawData) => {
  const groups = new Map();
  (rawData?.features || []).forEach(f => {
    const id = f.properties?.id;
    if (!id) return;
    const base = firBaseId(id);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(f);
  });

  // 国ごとの FIR 数を数え、2つ以上ある国だけを統合対象にする
  const countryCount = new Map();
  groups.forEach((pieces, base) => {
    const c = firCountryOf(base);
    if (c) countryCount.set(c, (countryCount.get(c) || 0) + 1);
  });

  const features = [];
  const labels = [];
  const bucketMembers = new Map();

  const pushIndividual = (base, pieces, outline) => {
    const oceanic = pieces.some(f => String(f.properties?.oceanic) === '1');
    features.push({
      type: 'Feature',
      properties: { id: base, name: base, oceanic },
      geometry: { type: 'MultiLineString', coordinates: outline }
    });
    // ラベル位置はデータ側が label_lon/label_lat として持っている
    const labelSrc = pieces.find(f => f.properties?.id === base) || pieces[0];
    const labelLat = parseFloat(labelSrc.properties?.label_lat);
    const labelLon = parseFloat(labelSrc.properties?.label_lon);
    if (Number.isFinite(labelLat) && Number.isFinite(labelLon)) {
      labels.push({ id: base, lat: labelLat, lon: labelLon });
    }
  };

  groups.forEach((pieces, base) => {
    // 経度180°の継ぎ目に立つ人工的な縦線は最初に落とす
    const outline = firOutlineForGroup(base, pieces).filter(s => !firIsSeamSegment(s));
    if (outline.length === 0) return;
    const country = firCountryOf(base);
    if (country && countryCount.get(country) >= 2) {
      if (!bucketMembers.has(country)) bucketMembers.set(country, []);
      bucketMembers.get(country).push({ base, outline, pieces });
      return;
    }
    pushIndividual(base, pieces, outline);
  });

  // 国統合: メンバーの輪郭辺を「ユニオンの内側にあるか」で分類し、
  // 外枠だけを残す (firUnionCountryOutline)。その後、監査条件に
  // 抵触する辺を分割除去する (firSplitForUnionAudit)。
  bucketMembers.forEach((members, country) => {
    let outline = firUnionCountryOutline(members);
    outline = firSplitForUnionAudit(members, outline).filter(s => !firIsSeamSegment(s));
    if (outline.length === 0) return;
    const bucketName = `${country} (Integrated FIRs)`;
    features.push({
      type: 'Feature',
      properties: { id: bucketName, name: bucketName, oceanic: false },
      geometry: { type: 'MultiLineString', coordinates: outline }
    });
  });

  return { features: { type: 'FeatureCollection', features }, labels };
};

const getProcessedFirData = () => {
  if (firProcessedCache) return Promise.resolve(firProcessedCache);
  if (!firFetchPromise) {
    firFetchPromise = fetch(FIR_DATA_URL)
      .then(res => { if (!res.ok) throw new Error(`FIR Fetch Failed: ${res.status}`); return res.json(); })
      .then(raw => { firProcessedCache = processFirData(raw); return firProcessedCache; })
      .catch(err => { firFetchPromise = null; console.error('Failed to load FIR data', err); return null; });
  }
  return firFetchPromise;
};

// =========================================================================
// Weather Radar Map View
// =========================================================================
const WeatherRadarMap = ({ 
    navlogData, routeWps, frameIndex, setFrameIndex, isPlaying, setIsPlaying, maxFrames, setMaxFrames,
    deviationNM, setDeviationNM, opacity, setOpacity,
    showHimawari, setShowHimawari, showGoesEast, setShowGoesEast, showGoesWest, setShowGoesWest, showMeteosat, setShowMeteosat,
    showPolar, setShowPolar,
    showRadar, setShowRadar, showNavlogRoute, setShowNavlogRoute,
    showAirspace, setShowAirspace, showFIR, setShowFIR, safeFrameIndex
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [activeSat, setActiveSat] = useState(() => pickSatelliteForLongitude(135)); // 表示中心の経度から判定した担当衛星

  const [rvRadarFrames, setRvRadarFrames] = useState([]);
  const [jmaFrames, setJmaFrames] = useState([]);
  const prevRouteStrRef = useRef("");

  const RDR_CACHE_KEY = 'efb_rdr_layer_cache';

  const fetchData = useCallback(() => {
      const cb = new Date().getTime();
      fetch(`https://api.rainviewer.com/public/weather-maps.json?_=${cb}`)
        .then(res => res.json())
        .then(data => {
          const host = data.host || 'https://tilecache.rainviewer.com';
          const rFrames = data.radar?.past ? data.radar.past.map(f => ({ ...f, host })) : [];
          setRvRadarFrames(rFrames);
          
          try {
              const currentCache = JSON.parse(localStorage.getItem(RDR_CACHE_KEY) || '{}');
              currentCache.rvRadarFrames = rFrames;
              localStorage.setItem(RDR_CACHE_KEY, JSON.stringify(currentCache));
          } catch(e) {}
        }).catch(err => {
            console.warn("RainViewer Fetch Error, trying cache...", err);
        });

      fetch(`https://www.jma.go.jp/bosai/himawari/data/satimg/targetTimes_fd.json?_=${cb}`)
        .then(res => res.json())
        .then(data => { 
            if (Array.isArray(data) && data.length > 0) {
                const jFrames = data.slice(-24);
                setJmaFrames(jFrames);
                try {
                    const currentCache = JSON.parse(localStorage.getItem(RDR_CACHE_KEY) || '{}');
                    currentCache.jmaFrames = jFrames;
                    localStorage.setItem(RDR_CACHE_KEY, JSON.stringify(currentCache));
                } catch(e) {}
            } 
        }).catch(err => {
             console.warn("JMA Fetch Error, trying cache...", err);
        });
  }, []);

  useEffect(() => {
      try {
          const cached = JSON.parse(localStorage.getItem(RDR_CACHE_KEY) || '{}');
          if (cached.rvRadarFrames) setRvRadarFrames(cached.rvRadarFrames);
          if (cached.jmaFrames) setJmaFrames(cached.jmaFrames);
      } catch (e) {}
  }, []);

  useEffect(() => {
    const handleRefresh = () => { fetchData(); };
    window.addEventListener('refreshWX', handleRefresh);
    return () => window.removeEventListener('refreshWX', handleRefresh);
  }, [fetchData]);

  useEffect(() => {
      fetchData();
      const interval = setInterval(fetchData, 5 * 60 * 1000);
      return () => clearInterval(interval);
  }, [fetchData]);

  const himawariLayerRef = useRef(null);
  const goesEastLayerRef = useRef(null); 
  const goesWestLayerRef = useRef(null);
  const meteosatLayerRef = useRef(null); 
  const meteosatIodcLayerRef = useRef(null);
  const polarM01LayerRef = useRef(null);
  const polarM02LayerRef = useRef(null);
  const polarM03LayerRef = useRef(null);
  const radarLayerRef = useRef(null);
  const opacityRef = useRef(opacity); // 地図初期化は初回マウント時の不透明度だけを使い、値の変化では地図を作り直さない

  useEffect(() => {
    let isMounted = true;
    const loadLeaflet = async () => {
      try {
        if (!window.L) {
          const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
          const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          await new Promise((resolve, reject) => { script.onload = resolve; script.onerror = reject; document.head.appendChild(script); });
        }

        if (isMounted && mapContainerRef.current) {
          if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
          const L = window.L;
          const initialOpacity = opacityRef.current;
          const map = L.map(mapContainerRef.current, { center: [35.0, 135.0], zoom: 3, zoomControl: false, attributionControl: false, worldCopyJump: true });
          L.control.zoom({ position: 'bottomright' }).addTo(map);

          const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { 
              maxZoom: 16, zIndex: 0 
          }).addTo(map);
          mapInstanceRef.current = map;
          layersRef.current.base = darkBase;

          // サテライトとレーダーの重なり順（Z-Index）を管理する専用Paneを作成
          map.createPane('satellitePane');
          map.getPane('satellitePane').style.zIndex = 250; 
          map.getPane('satellitePane').style.mixBlendMode = 'screen'; // 雲画像の黒背景を透過

          map.createPane('radarPane');
          map.getPane('radarPane').style.zIndex = 300; // レーダーは必ずサテライトの上に描画する

          map.createPane('firPane');
          map.getPane('firPane').style.zIndex = 350; // FIR境界: サテライト/レーダーより上、ルート等の overlayPane(400) より下

          const style = document.createElement('style');
          style.id = 'rdr-map-custom-styles';
          style.innerHTML = `
            .nav-tooltip { background-color: rgba(15, 23, 42, 0.85) !important; border: 1px solid rgba(56, 189, 248, 0.4) !important; color: #e0f2fe !important; font-size: 10px !important; font-weight: bold !important; padding: 2px 6px !important; border-radius: 4px !important; box-shadow: 0 2px 4px rgba(0,0,0,0.5) !important; }
            .airspace-tooltip { background-color: rgba(0, 0, 0, 0.7) !important; border: 1px solid #38bdf8 !important; color: #bae6fd !important; font-size: 10px !important; font-weight: bold !important; padding: 2px 6px !important; border-radius: 4px !important; }
            .airspace-restricted { background-color: rgba(0, 0, 0, 0.7) !important; border: 1px solid #ef4444 !important; color: #fca5a5 !important; font-size: 10px !important; font-weight: bold !important; padding: 2px 6px !important; border-radius: 4px !important; }
            .fir-tooltip { background-color: rgba(255, 255, 255, 0.8) !important; border: 1px solid #f97316 !important; color: #c2410c !important; font-size: 10px !important; font-weight: bold !important; padding: 2px 6px !important; border-radius: 4px !important; }
            .fir-label-icon { background: transparent !important; border: none !important; pointer-events: none !important; }
            .fir-label-text { display: block; transform: translate(-50%, -50%); font-size: 9px; font-weight: bold; letter-spacing: 0.08em; color: #ffedd5; text-shadow: 0 0 3px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.95), 1px 0 2px rgba(0,0,0,0.9), -1px 0 2px rgba(0,0,0,0.9); white-space: nowrap; }
          `;
          if (!document.getElementById('rdr-map-custom-styles')) document.head.appendChild(style);

          const errImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          
          // 各静止衛星レイヤーには担当経度範囲 (bounds) を付け、その範囲外ではタイルを取得しない。
          // これにより、円盤の縁で強く歪んだ他衛星の画像が重なって表示されなくなる。
          meteosatLayerRef.current = L.tileLayer.wms(EUMETSAT_WMS_URL, { ...buildMeteosatWmsParams('meteosat-fes'), opacity: initialOpacity, pane: 'satellitePane', bounds: latLngBoundsForSatellite(L, 'meteosat-fes') }).addTo(map);
          meteosatIodcLayerRef.current = L.tileLayer.wms(EUMETSAT_WMS_URL, { ...buildMeteosatWmsParams('meteosat-iodc'), opacity: initialOpacity, pane: 'satellitePane', bounds: latLngBoundsForSatellite(L, 'meteosat-iodc') }).addTo(map);
          goesEastLayerRef.current = L.tileLayer(errImg, { opacity: initialOpacity, maxNativeZoom: 7, maxZoom: 16, noWrap: false, errorTileUrl: errImg, pane: 'satellitePane', bounds: latLngBoundsForSatellite(L, 'goes-east') }).addTo(map);
          goesWestLayerRef.current = L.tileLayer(errImg, { opacity: initialOpacity, maxNativeZoom: 7, maxZoom: 16, noWrap: false, errorTileUrl: errImg, pane: 'satellitePane', keepBuffer: 16, bounds: latLngBoundsForSatellite(L, 'goes-west') }).addTo(map);
          himawariLayerRef.current = L.tileLayer(errImg, { opacity: initialOpacity, minZoom: 3, maxNativeZoom: 5, maxZoom: 16, noWrap: false, errorTileUrl: errImg, pane: 'satellitePane', keepBuffer: 16, bounds: latLngBoundsForSatellite(L, 'himawari') }).addTo(map);

          // POLAR: 極軌道衛星 Metop の AVHRR 赤外 (IR10.8)。静止衛星は高緯度で円盤の縁になり使い物に
          // ならないため、グリーンランド等の極域はこのレイヤーで見る。Meteosat と同じ EUMETSAT WMS
          // から Metop 3機分を重ね描きし、GEO 画像より上に来るよう最後に追加する。
          // updated7: eps の IR 画像はモザイクでほぼ全面を不透明に覆うグレースケール (寒冷な地表面・
          // 氷床ほど白い) のため、全世界・デフォルト ON だとカラーの GEO 画像全体が白く霞んだ。
          // 対策として (1) 表示範囲を北緯58°以北に限定 (bounds) し、(2) デフォルト OFF にした。
          // グリーンランド周辺では GEO が実用外で POLAR が主役になるため、重ね順は GEO の上のまま。
          const polarBounds = L.latLngBounds(L.latLng(58, -180), L.latLng(90, 180));
          polarM01LayerRef.current = L.tileLayer.wms(EUMETSAT_WMS_URL, { layers: 'eps:m01_ir108', format: 'image/png', transparent: true, version: '1.3.0', opacity: initialOpacity, pane: 'satellitePane', bounds: polarBounds, attribution: 'EUMETSAT Metop AVHRR IR10.8' }).addTo(map);
          polarM02LayerRef.current = L.tileLayer.wms(EUMETSAT_WMS_URL, { layers: 'eps:m02_ir108', format: 'image/png', transparent: true, version: '1.3.0', opacity: initialOpacity, pane: 'satellitePane', bounds: polarBounds, attribution: 'EUMETSAT Metop AVHRR IR10.8' }).addTo(map);
          polarM03LayerRef.current = L.tileLayer.wms(EUMETSAT_WMS_URL, { layers: 'eps:m03_ir108', format: 'image/png', transparent: true, version: '1.3.0', opacity: initialOpacity, pane: 'satellitePane', bounds: polarBounds, attribution: 'EUMETSAT Metop AVHRR IR10.8' }).addTo(map);

          // 表示中心の経度から「その場所を担当する衛星 (直下点が最も近い衛星)」を自動判定し、情報パネルに表示する
          const updateActiveSat = () => {
              const sat = pickSatelliteForLongitude(map.getCenter().lng);
              setActiveSat(prev => (prev && prev.id === sat.id ? prev : sat));
          };
          map.on('moveend', updateActiveSat);
          updateActiveSat();
          radarLayerRef.current = L.tileLayer(errImg, { opacity: initialOpacity, maxZoom: 16, noWrap: false, errorTileUrl: errImg, pane: 'radarPane' }).addTo(map);

          setIsMapLoaded(true);
        }
      } catch (err) { console.error("Map initialization failed", err); }
    };
    loadLeaflet();
    return () => { isMounted = false; if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []); 

  useEffect(() => {
      let activeLengths = [];
      if (showHimawari && jmaFrames.length > 0) activeLengths.push(jmaFrames.length);
      if (showRadar && rvRadarFrames.length > 0) activeLengths.push(rvRadarFrames.length);
      
      const mFrames = activeLengths.length > 0 ? Math.max(...activeLengths, 1) : 1;
      setMaxFrames(mFrames);
      setFrameIndex(mFrames - 1);
      setIsPlaying(false);
  }, [showHimawari, showRadar, jmaFrames.length, rvRadarFrames.length, setMaxFrames, setFrameIndex, setIsPlaying]);

  const getLayerFrameIndex = (layerFramesLength) => {
      if (layerFramesLength <= 1 || maxFrames <= 1) return layerFramesLength - 1;
      return Math.floor((safeFrameIndex / (maxFrames - 1)) * (layerFramesLength - 1));
  };

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;
    setTimeout(() => { if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize(); }, 200);
    const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });
    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isMapLoaded]);

  useEffect(() => {
    if (!isMapLoaded || !himawariLayerRef.current || !window.L) return;
    opacityRef.current = opacity;
    const errImg = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // 1. HIMAWARI (SND/ETC, jpg。カラーの雲頂強調画像。タイル取得は生成時の bounds で担当範囲内に制限)
    let himawariUrl = errImg;
    if (showHimawari && jmaFrames.length > 0) {
        const frame = jmaFrames[Math.max(0, Math.min(getLayerFrameIndex(jmaFrames.length), jmaFrames.length - 1))];
        const builtHimawariUrl = buildHimawariTileUrl(frame); if (builtHimawariUrl) himawariUrl = builtHimawariUrl;
    }
    if (himawariLayerRef.current._url !== himawariUrl) himawariLayerRef.current.setUrl(himawariUrl);
    himawariLayerRef.current.setOpacity(showHimawari ? opacity : 0);

    let goesEastUrl = errImg;
    if (showGoesEast) goesEastUrl = buildGoesTileUrl('goes-east');
    if (goesEastLayerRef.current._url !== goesEastUrl) goesEastLayerRef.current.setUrl(goesEastUrl);
    goesEastLayerRef.current.setOpacity(showGoesEast ? opacity : 0);

    // 2. GOES-W を安定したXYZのフルディスクに変更 (扇形回避、極点の過度な歪みはカット)
    let goesWestUrl = errImg;
    if (showGoesWest) goesWestUrl = buildGoesTileUrl('goes-west');
    if (goesWestLayerRef.current._url !== goesWestUrl) goesWestLayerRef.current.setUrl(goesWestUrl);
    goesWestLayerRef.current.setOpacity(showGoesWest ? opacity : 0);

    meteosatLayerRef.current.setOpacity(showMeteosat ? opacity : 0);
    if (meteosatIodcLayerRef.current) meteosatIodcLayerRef.current.setOpacity(showMeteosat ? opacity : 0);
    // Meteosat (WMS) は非表示でもタイル取得が続くため、OFF時はレイヤー自体を地図から外して通信を止める
    if (mapInstanceRef.current) {
      [meteosatLayerRef.current, meteosatIodcLayerRef.current].forEach(l => {
        if (!l) return;
        if (showMeteosat && !mapInstanceRef.current.hasLayer(l)) l.addTo(mapInstanceRef.current);
        if (!showMeteosat && mapInstanceRef.current.hasLayer(l)) mapInstanceRef.current.removeLayer(l);
      });
    }

    // POLAR (Metop AVHRR, WMS) も Meteosat と同様に最新画像のみ。OFF時はレイヤー自体を外して通信を止める
    [polarM01LayerRef.current, polarM02LayerRef.current, polarM03LayerRef.current].forEach(l => {
      if (l) l.setOpacity(showPolar ? opacity : 0);
    });
    if (mapInstanceRef.current) {
      [polarM01LayerRef.current, polarM02LayerRef.current, polarM03LayerRef.current].forEach(l => {
        if (!l) return;
        if (showPolar && !mapInstanceRef.current.hasLayer(l)) l.addTo(mapInstanceRef.current);
        if (!showPolar && mapInstanceRef.current.hasLayer(l)) mapInstanceRef.current.removeLayer(l);
      });
    }

    let radarUrl = errImg;
    if (showRadar && rvRadarFrames.length > 0) {
        const idx = getLayerFrameIndex(rvRadarFrames.length);
        if (idx >= 0 && idx < rvRadarFrames.length) {
            const frame = rvRadarFrames[idx];
            if (frame) radarUrl = `${frame.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
        }
    }
    if (radarLayerRef.current._url !== radarUrl) radarLayerRef.current.setUrl(radarUrl);
    radarLayerRef.current.setOpacity(showRadar ? opacity : 0);
  }, [isMapLoaded, frameIndex, safeFrameIndex, opacity, showHimawari, showGoesEast, showGoesWest, showMeteosat, showPolar, showRadar, jmaFrames, rvRadarFrames, maxFrames]);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    if (layersRef.current.navlogGroup) map.removeLayer(layersRef.current.navlogGroup);
    
    if (showNavlogRoute && routeWps && routeWps.length > 0) {
        const navlogGroup = L.layerGroup();
        
        const validWps = routeWps.filter(pt => pt && pt.lat != null && pt.lon != null && !isNaN(pt.lat) && !isNaN(pt.lon));

        if (validWps.length > 0) {
            const latlngs = validWps.map(pt => [pt.lat, pt.lon]);
            normalizeLongitudes(latlngs); 
            
            const drawRoute = (offsetLng) => {
                const shiftedLatLngs = latlngs.map(ll => [ll[0], ll[1] + offsetLng]);
                const flightPath = L.polyline(shiftedLatLngs, { color: '#38bdf8', weight: 3, opacity: 0.9 });
                navlogGroup.addLayer(flightPath);

                if (deviationNM > 0) {
                    const rightOffset = calculateOffsetLine(latlngs, deviationNM).map(ll => [ll[0], ll[1] + offsetLng]);
                    const leftOffset = calculateOffsetLine(latlngs, -deviationNM).map(ll => [ll[0], ll[1] + offsetLng]);
                    navlogGroup.addLayer(L.polyline(rightOffset, { color: '#8b5cf6', weight: 2, opacity: 0.8, dashArray: '6, 6' }));
                    navlogGroup.addLayer(L.polyline(leftOffset, { color: '#8b5cf6', weight: 2, opacity: 0.8, dashArray: '6, 6' }));
                }

                let indexInFiltered = 0;
                routeWps.forEach((pt, originalIndex) => {
                    if (!pt || pt.lat == null || pt.lon == null || isNaN(pt.lat) || isNaN(pt.lon)) return;
                    if (indexInFiltered >= latlngs.length) return;

                    const isAp = originalIndex === 0 || originalIndex === routeWps.length - 1;
                    const isTocTod = pt.isSpecialWp;
                    
                    let radius = 4; let color = '#ffffff'; let fillColor = '#38bdf8';
                    if (isAp) { radius = 6; color = '#0ea5e9'; fillColor = '#e0f2fe'; }
                    else if (isTocTod) { radius = 4; color = '#d946ef'; fillColor = '#fdf4ff'; }

                    const marker = L.circleMarker([latlngs[indexInFiltered][0], latlngs[indexInFiltered][1] + offsetLng], { radius, color, fillColor, fillOpacity: 1.0, weight: 2 });
                    marker.bindTooltip(pt.name, { permanent: true, direction: 'right', className: 'nav-tooltip' });
                    navlogGroup.addLayer(marker);
                    
                    indexInFiltered++;
                });
            };

            drawRoute(0);
            drawRoute(360);
            drawRoute(-360);

            const currentRouteStr = validWps.map(w => w.name).join('-');
            if (prevRouteStrRef.current !== currentRouteStr) {
                if (latlngs.length >= 2) {
                    const bounds = L.polyline(latlngs).getBounds();
                    if (bounds && bounds.isValid()) {
                        try {
                            setTimeout(() => { 
                                if (mapInstanceRef.current) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] }); 
                            }, 50);
                        } catch (e) { console.warn('Leaflet fitBounds error:', e); }
                    }
                } else if (latlngs.length === 1) {
                    map.setView(latlngs[0], 6);
                }
                prevRouteStrRef.current = currentRouteStr;
            }
        }
        navlogGroup.addTo(map);
        layersRef.current.navlogGroup = navlogGroup;
    } else {
        prevRouteStrRef.current = "";
    }

    if (layersRef.current.airspaceGroup) map.removeLayer(layersRef.current.airspaceGroup);
    if (showAirspace) {
        const airspaceGroup = L.layerGroup();
        AIRSPACE_DATA.forEach(airspace => {
            let color = '#38bdf8'; 
            if (airspace.type === 'itra') color = '#eab308'; 
            else if (airspace.type === 'restricted') color = '#ef4444'; 
            
            const poly = L.polygon(airspace.coords, { color: color, weight: 2, fillColor: color, fillOpacity: 0.15 });
            poly.bindTooltip(`<div class="text-center font-bold"><div class="border-b border-slate-600/50 pb-0.5 mb-0.5">${airspace.name}</div><div class="text-[10px] opacity-80">${airspace.alt}</div></div>`, { sticky: true, className: airspace.type === 'restricted' ? 'airspace-restricted' : 'airspace-tooltip' });
            airspaceGroup.addLayer(poly);
        });
        airspaceGroup.addTo(map);
        layersRef.current.airspaceGroup = airspaceGroup;
    }
  }, [isMapLoaded, navlogData, routeWps, showNavlogRoute, deviationNM, showAirspace]);

  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    let cancelled = false;

    if (layersRef.current.firGroup) {
      map.removeLayer(layersRef.current.firGroup);
      layersRef.current.firGroup = null;
    }
    if (layersRef.current.firLabelGroup) {
      map.removeLayer(layersRef.current.firLabelGroup);
      layersRef.current.firLabelGroup = null;
    }

    if (!showFIR) return;

    // FIR専用Pane (zIndex 350): サテライト(250)/レーダー(300)より上、
    // ルートや空域が載る overlayPane(400) より下に固定する
    const firGroup = L.layerGroup();
    layersRef.current.firGroup = firGroup;
    firGroup.addTo(map);
    const firLabelGroup = L.layerGroup();
    layersRef.current.firLabelGroup = firLabelGroup;

    // FIR名ラベルは混雑を避けるためズーム5以上でのみ表示する
    const updateFirLabels = () => {
      if (map.getZoom() >= 5) {
        if (!map.hasLayer(firLabelGroup)) firLabelGroup.addTo(map);
      } else if (map.hasLayer(firLabelGroup)) {
        map.removeLayer(firLabelGroup);
      }
    };
    map.on('zoomend', updateFirLabels);

    getProcessedFirData().then(data => {
      if (cancelled || !data) return;
      // 大量の線はSVGではなくCanvasで描く (タブレットでの描画負荷対策)
      const renderer = L.canvas({ pane: 'firPane', padding: 0.5 });
      // 下地 (暗色の太線) + 本線 (橙) の二重描きで、白い雲・暗い海の両方で読めるようにする
      const casingStyle = (feature) => ({
        color: '#0f172a', weight: feature.properties?.oceanic ? 6 : 5, opacity: 0.45, lineCap: 'round', lineJoin: 'round'
      });
      const coreStyle = (feature) => ({
        color: '#fb923c', weight: feature.properties?.oceanic ? 2.75 : 2, opacity: 0.95, lineCap: 'round', lineJoin: 'round'
      });
      const createGeoJSON = (offsetLng, style, interactive) => L.geoJSON(data.features, {
        pane: 'firPane',
        renderer,
        coordsToLatLng: (coords) => new L.LatLng(coords[1], coords[0] + offsetLng),
        style,
        interactive,
        onEachFeature: interactive ? (feature, layer) => {
          const name = feature.properties?.name || feature.properties?.id;
          if (name && !name.includes('Integrated FIRs')) layer.bindTooltip(name, { sticky: true, className: 'fir-tooltip' });
        } : undefined
      });
      [0, 360, -360].forEach(offsetLng => {
        firGroup.addLayer(createGeoJSON(offsetLng, casingStyle, false));
        firGroup.addLayer(createGeoJSON(offsetLng, coreStyle, true));
      });
      data.labels.forEach(({ id, lat, lon }) => {
        firLabelGroup.addLayer(L.marker([lat, lon], {
          pane: 'firPane',
          interactive: false,
          keyboard: false,
          icon: L.divIcon({ className: 'fir-label-icon', html: `<span class="fir-label-text">${id}</span>`, iconSize: null })
        }));
      });
      updateFirLabels();
    });

    return () => {
      cancelled = true;
      map.off('zoomend', updateFirLabels);
      if (map.hasLayer(firLabelGroup)) map.removeLayer(firLabelGroup);
    };
  }, [isMapLoaded, showFIR]);

  let currentTimeLabel = "LIVE";
  let activeLayerName = "No Layer Selected";

  let layerNames = [];
  if (showHimawari) layerNames.push("HIMAWARI");
  if (showGoesEast) layerNames.push("GOES-E");
  if (showGoesWest) layerNames.push("GOES-W");
  if (showMeteosat) layerNames.push("METEOSAT");
  if (showPolar) layerNames.push("POLAR");
  if (showRadar) layerNames.push("RADAR");

  if (layerNames.length > 0) {
      activeLayerName = layerNames.join(" + ");
  }

  if (showHimawari && jmaFrames.length > 0) {
      const idx = Math.max(0, Math.min(getLayerFrameIndex(jmaFrames.length), jmaFrames.length - 1));
      if (jmaFrames[idx]) currentTimeLabel = formatJmaTime(jmaFrames[idx].validtime || jmaFrames[idx].basetime);
  } else if (showRadar && rvRadarFrames.length > 0) {
       const idx = Math.max(0, Math.min(getLayerFrameIndex(rvRadarFrames.length), rvRadarFrames.length - 1));
       if (rvRadarFrames[idx]) currentTimeLabel = formatRvTime(rvRadarFrames[idx].time);
  }

  return (
    <div className="flex-1 relative w-full h-full min-h-[400px] z-0">
        <div ref={mapContainerRef} className="absolute inset-0 bg-slate-900" style={{ zIndex: 0 }} />
        
        <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 backdrop-blur-sm text-xs text-slate-300 font-mono pointer-events-none space-y-1 shadow-xl min-w-[220px]">
          <div className="flex items-center justify-between text-sky-400 font-bold border-b border-slate-700 pb-2 mb-2">
            <span>RADAR & SAT SYNC</span>
            <span className="text-[10px] bg-sky-950 border border-sky-800 text-sky-300 px-1.5 py-0.5 rounded ml-2">{currentTimeLabel}</span>
          </div>
          <div className="leading-tight">{activeLayerName}</div>
          <div className="leading-tight border-t border-slate-800 pt-1 mt-1">AUTO SAT: <span className="text-sky-300 font-bold">{activeSat.shortLabel}</span> <span className="text-slate-400">({activeSat.satellite} / {activeSat.subLon}&deg;)</span></div>
          <div className="text-[10px] text-slate-500 leading-tight">{activeSat.attribution} — {activeSat.product}</div>
          {navlogData && (navlogData.fNo || navlogData.depIcao || navlogData.destIcao) && (
            <div className="text-amber-300 font-bold border-t border-slate-800 pt-2 mt-2 flex justify-between gap-4">
              <span>{navlogData.fNo || 'ROUTE'} : {navlogData.depIcao || 'DEP'} &rarr; {navlogData.destIcao || 'ARR'}</span>
              {deviationNM > 0 && <span className="text-violet-400">DEV ±{deviationNM}NM</span>}
            </div>
          )}
        </div>
    </div>
  );
};

// =========================================================================
// Main Export Component
// =========================================================================
export const WeatherRadarView = ({ navlogData }) => {
    const [activeSubTab, setActiveSubTab] = useState('map');
    const [routeWps, setRouteWps] = useState([]);
    const [weatherData, setWeatherData] = useState([]);
    const [weatherTimes, setWeatherTimes] = useState([]);
    const [timeIndex, setTimeIndex] = useState(0);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);
    const [showTemp, setShowTemp] = useState(false);
    
    // Map側に渡すための状態をメインコンポーネントで管理
    const [showHimawari, setShowHimawari] = useState(true);
    const [showGoesEast, setShowGoesEast] = useState(true); 
    const [showGoesWest, setShowGoesWest] = useState(true); 
    const [showMeteosat, setShowMeteosat] = useState(true); 
    const [showPolar, setShowPolar] = useState(false); // updated7: デフォルト OFF (理由は下記 updated7 注記)
    const [showRadar, setShowRadar] = useState(true);
    const [showNavlogRoute, setShowNavlogRoute] = useState(true);
    const [showAirspace, setShowAirspace] = useState(true);
    const [showFIR, setShowFIR] = useState(true);
    const [opacity, setOpacity] = useState(0.85); 
    const [deviationNM, setDeviationNM] = useState(0); 

    const [frameIndex, setFrameIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [maxFrames, setMaxFrames] = useState(1);
    const [toastData, setToastData] = useState({ message: '', visible: false });

    const safeFrameIndex = Math.max(0, Math.min(frameIndex, maxFrames - 1));

    const showToast = useCallback((message) => {
        setToastData({ message, visible: true });
        setTimeout(() => setToastData({ message: '', visible: false }), 4000);
    }, []);

    // MAPアニメーション再生: isPlaying の間はフレームを自動で進める (従来は再生ボタンが状態を変えるだけで進まなかった)
    useEffect(() => {
        if (!isPlaying || maxFrames <= 1) return;
        const id = setInterval(() => {
            setFrameIndex(prev => (prev + 1) % maxFrames);
        }, 700);
        return () => clearInterval(id);
    }, [isPlaying, maxFrames]);

    // Parse navlogData to generate route geometry with flight levels
    useEffect(() => {
        if (navlogData && navlogData.newPlan && navlogData.newPlan.length > 0) {
            let wps = [];
            const cruiseFL = navlogData.alt ? Math.round(navlogData.alt / 100) : 350;

            if (navlogData.depIcao) {
                const firstWp = parseWaypointToLatLng({ wp: navlogData.depIcao });
                if (firstWp && (firstWp.lat !== 0 || firstWp.lon !== 0)) {
                    wps.push({ ...firstWp, name: navlogData.depIcao, fl: 0, ctme: 0 });
                }
            }

            navlogData.newPlan.forEach(wp => {
                if (!wp || !wp.wp) return;
                if (wps.length > 0 && wps[wps.length - 1].name === wp.wp) return;
                
                let wpCoord = parseWaypointToLatLng(wp);
                if (!wpCoord && wp.latLon) wpCoord = parseWaypointToLatLng({ wp: wp.wp, latLon: wp.latLon });
                
                if (wpCoord && (wpCoord.lat !== null && wpCoord.lon !== null) && (wpCoord.lat !== 0 || wpCoord.lon !== 0)) {
                    let fl = 0;
                    if (wp.plnAlt) {
                        const match = wp.plnAlt.match(/FL(\d{3})/i) || wp.plnAlt.match(/(\d{3})00/);
                        if (match) fl = parseInt(match[1], 10);
                    }
                    if (fl === 0 && wp.fl) fl = wp.fl;
                    
                    const isSpecial = wp.wp === 'TOC' || wp.wp === 'TOD' || /^ETP/.test(wp.wp);
                    wps.push({ ...wpCoord, fl: fl, isClimbOrDescent: wp.isClimbOrDescent, isSpecialWp: isSpecial, ctme: wp.ctme || 0 });
                }
            });

            if (navlogData.destIcao) {
                if (wps.length > 0 && wps[wps.length - 1].name === navlogData.destIcao) wps.pop();
                const lastPlanWp = navlogData.newPlan[navlogData.newPlan.length - 1];
                let destCoord = parseWaypointToLatLng({ wp: navlogData.destIcao });
                if (!destCoord && lastPlanWp) destCoord = parseWaypointToLatLng(lastPlanWp);
                const lastCtme = lastPlanWp ? (lastPlanWp.ctme || 0) : 0;
                if (destCoord) wps.push({ ...destCoord, name: navlogData.destIcao, fl: 0, ctme: lastCtme });
            }

            let accumulatedDistances = [0];
            for (let i = 1; i < wps.length; i++) {
                const dist = getDistanceNM(wps[i-1].lat, wps[i-1].lon, wps[i].lat, wps[i].lon);
                accumulatedDistances.push(accumulatedDistances[i-1] + dist);
            }

            for (let i = 1; i < wps.length - 1; i++) {
                if (wps[i].fl === null || wps[i].fl === undefined || wps[i].fl === 0) {
                    let prevIdx = -1, nextIdx = -1;
                    for (let j = i - 1; j >= 0; j--) { if (wps[j].fl !== null && wps[j].fl !== undefined && wps[j].fl !== 0) { prevIdx = j; break; } }
                    for (let k = i + 1; k < wps.length; k++) { if (wps[k].fl !== null && wps[k].fl !== undefined && wps[k].fl !== 0) { nextIdx = k; break; } }

                    if (prevIdx !== -1 && nextIdx !== -1) {
                        const distFromPrev = accumulatedDistances[i] - accumulatedDistances[prevIdx];
                        const totalDistBetween = accumulatedDistances[nextIdx] - accumulatedDistances[prevIdx];
                        const ratio = totalDistBetween > 0 ? distFromPrev / totalDistBetween : 0.5;
                        wps[i].fl = Math.round(wps[prevIdx].fl + (wps[nextIdx].fl - wps[prevIdx].fl) * ratio);
                    } else {
                        wps[i].fl = cruiseFL;
                    }
                }
            }

            setRouteWps(wps);
            const validWpsForWeather = wps.filter(wp => !wp.isSpecialWp);
            if (validWpsForWeather.length > 0) {
                fetchWeatherDataForRoute(validWpsForWeather);
            }
        } else {
            setRouteWps([]);
            setWeatherData([]);
        }
    }, [navlogData]);

    const CS_CACHE_KEY = 'efb_cross_section_cache_v2';

    const fetchWeatherDataForRoute = async (wps) => {
        setIsLoadingWeather(true);
        showToast('気象データを取得・解析中...');
        const routeKey = wps.map(w => w.name).join('-');

        const processWeatherData = (results) => {
            const now = new Date();
            const currentHourStr = now.toISOString().substring(0, 13) + ":00";
            let startIndex = results[0].hourly.time.findIndex(t => t.startsWith(currentHourStr));
            if (startIndex === -1) startIndex = 0;
            const targetIndices = Array.from({length: 12}, (_, i) => startIndex + i);
            
            const times = targetIndices.map(i => {
                const d = new Date(results[0].hourly.time[i] + 'Z');
                return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}Z`;
            });
            setWeatherTimes(times);

            const levelMap = { 1000: { fl: 0 }, 850: { fl: 50 }, 700: { fl: 100 }, 500: { fl: 180 }, 400: { fl: 240 }, 300: { fl: 300 }, 250: { fl: 340 }, 200: { fl: 390 }, 150: { fl: 450 } };

            const wData = [];
            for (let tIdx = 0; tIdx < targetIndices.length; tIdx++) {
                const dataIndex = targetIndices[tIdx];
                const timeSlice = {};

                wps.forEach((wp, wpIdx) => {
                    const wpData = results[wpIdx] || results[0]; 
                    const profile = []; 
                    [1000, 850, 700, 500, 400, 300, 250, 200, 150].forEach(p => {
                        const temp = wpData.hourly[`temperature_${p}hPa`][dataIndex];
                        const ws = wpData.hourly[`windspeed_${p}hPa`][dataIndex];
                        const wd = wpData.hourly[`winddirection_${p}hPa`][dataIndex];
                        if (temp !== null && ws !== null && wd !== null) profile.push({ fl: levelMap[p].fl, wd, ws: Math.round(ws), temp: Math.round(temp) });
                    });

                    const interpolated = {};
                    for (let fl = 0; fl <= 450; fl += 20) {
                        let below = profile[0], above = profile[profile.length - 1];
                        for (let i = 0; i < profile.length - 1; i++) {
                            if (profile[i].fl <= fl && profile[i+1].fl >= fl) { below = profile[i]; above = profile[i+1]; break; }
                        }
                        if (below.fl === above.fl) interpolated[fl] = { wd: below.wd, ws: below.ws, temp: below.temp };
                        else {
                             const ratio = (fl - below.fl) / (above.fl - below.fl);
                             let diff = above.wd - below.wd;
                             if (diff > 180) diff -= 360;
                             if (diff < -180) diff += 360;
                             interpolated[fl] = { wd: Math.round((below.wd + diff * ratio + 360) % 360), ws: Math.round(below.ws + (above.ws - below.ws) * ratio), temp: Math.round(below.temp + (above.temp - below.temp) * ratio) };
                        }
                    }
                    timeSlice[wp.name] = interpolated;
                });
                wData.push(timeSlice);
            }
            setWeatherData(wData);
            setTimeIndex(0); 
        };

        try {
            const lats = wps.map(wp => wp.lat).join(',');
            const lons = wps.map(wp => wp.lon).join(',');
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&hourly=temperature_1000hPa,windspeed_1000hPa,winddirection_1000hPa,temperature_850hPa,windspeed_850hPa,winddirection_850hPa,temperature_700hPa,windspeed_700hPa,winddirection_700hPa,temperature_500hPa,windspeed_500hPa,winddirection_500hPa,temperature_400hPa,windspeed_400hPa,winddirection_400hPa,temperature_300hPa,windspeed_300hPa,winddirection_300hPa,temperature_250hPa,windspeed_250hPa,winddirection_250hPa,temperature_200hPa,windspeed_200hPa,winddirection_200hPa,temperature_150hPa,windspeed_150hPa,winddirection_150hPa&windspeed_unit=kn&forecast_days=2`;

            const res = await fetch(url);
            const data = await res.json();
            const results = Array.isArray(data) ? data : [data];
            
            try {
                localStorage.setItem(CS_CACHE_KEY, JSON.stringify({ routeKey, results, timestamp: Date.now() }));
            } catch(e) {}

            processWeatherData(results);
            showToast('気象データを反映しました。');
        } catch (err) { 
            console.warn("Fetch failed, trying cache...", err); 
            try {
                const cached = JSON.parse(localStorage.getItem(CS_CACHE_KEY));
                if (cached && cached.routeKey === routeKey && cached.results) {
                    processWeatherData(cached.results);
                    showToast('オフライン: キャッシュから気象データを読み込みました。');
                } else {
                    showToast('気象データの取得に失敗しました。');
                }
            } catch (cacheErr) {
                showToast('気象データの取得に失敗しました。');
            }
        } 
        finally { setIsLoadingWeather(false); }
    };

    useEffect(() => {
        if (activeSubTab === 'map') {
            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
        }
    }, [activeSubTab]);

    return (
        <div className="flex flex-col absolute inset-0 bg-slate-950 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
            <Toast message={toastData.message} visible={toastData.visible} onClose={() => setToastData({ ...toastData, visible: false })} />

            <div className="flex items-center justify-between p-2 bg-slate-900 border-b border-slate-800 shrink-0 relative z-20 shadow-md w-full">
                <div className="flex items-center gap-2 mx-auto overflow-x-auto w-full px-2 hide-scrollbar">
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                        <button onClick={() => setActiveSubTab('map')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeSubTab === 'map' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>MAP</button>
                        <button onClick={() => setActiveSubTab('section')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${activeSubTab === 'section' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>CROSS SECTION</button>
                    </div>
                    <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                        <span className="text-slate-400 font-bold text-xs px-2 shrink-0">DEV:</span>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setDeviationNM(0)} 
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-colors shrink-0 ${deviationNM === 0 ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                            >
                                OFF
                            </button>
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                                <button 
                                    key={val} 
                                    onClick={() => setDeviationNM(val)} 
                                    className={`px-2 py-1 text-xs font-bold rounded-md transition-colors shrink-0 ${deviationNM === val ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button onClick={() => { window.dispatchEvent(new Event('refreshWX')); showToast("最新の気象画像を要求しました"); }} className="absolute right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg flex items-center justify-center transition-colors border border-slate-700" title="Refresh Weather">
                    <IconRefresh className="w-4 h-4" />
                </button>
            </div>

            {activeSubTab === 'map' && (
                <div className="w-full flex items-center p-2 bg-slate-800/60 border-b border-slate-700 text-xs flex-wrap gap-2 shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-3 flex-wrap text-[11px] w-full overflow-x-auto custom-scrollbar">
                    {maxFrames > 1 && (
                        <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700 shrink-0">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="text-sky-400 hover:text-white flex items-center justify-center w-4 h-4 mr-1">
                            {isPlaying ? "⏸" : "▶"}
                        </button>
                        <input type="range" min="0" max={maxFrames - 1} value={safeFrameIndex} onChange={(e) => { setIsPlaying(false); setFrameIndex(Number(e.target.value)); }} className="w-24 accent-sky-400 cursor-pointer" />
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded border border-slate-700 shrink-0">
                        <span className="text-slate-400 font-bold">Trans:</span>
                        <input type="range" min="0.1" max="1.0" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-16 accent-sky-400 cursor-pointer" />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800 px-2 py-1 rounded border border-slate-700 flex-wrap shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white"><input type="checkbox" checked={showHimawari} onChange={(e) => setShowHimawari(e.target.checked)} className="accent-sky-500 rounded" /><span>HIMAWARI</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white"><input type="checkbox" checked={showGoesEast} onChange={(e) => setShowGoesEast(e.target.checked)} className="accent-sky-500 rounded" /><span>GOES-E</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white"><input type="checkbox" checked={showGoesWest} onChange={(e) => setShowGoesWest(e.target.checked)} className="accent-sky-500 rounded" /><span>GOES-W</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white"><input type="checkbox" checked={showMeteosat} onChange={(e) => setShowMeteosat(e.target.checked)} className="accent-sky-500 rounded" /><span>METEOSAT</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white"><input type="checkbox" checked={showPolar} onChange={(e) => setShowPolar(e.target.checked)} className="accent-sky-500 rounded" /><span>POLAR</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white border-l border-slate-600 pl-2"><input type="checkbox" checked={showRadar} onChange={(e) => setShowRadar(e.target.checked)} className="accent-sky-500 rounded" /><span>RADAR</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white border-l border-slate-600 pl-2"><input type="checkbox" checked={showNavlogRoute} onChange={(e) => setShowNavlogRoute(e.target.checked)} className="accent-sky-500 rounded" /><span className="font-bold text-sky-400">Route</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white border-l border-slate-600 pl-2"><input type="checkbox" checked={showAirspace} onChange={(e) => setShowAirspace(e.target.checked)} className="accent-rose-500 rounded" /><span className="font-bold text-rose-400">空域(R/T/W)</span></label>
                        <label className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white border-l border-slate-600 pl-2"><input type="checkbox" checked={showFIR} onChange={(e) => setShowFIR(e.target.checked)} className="accent-orange-500 rounded" /><span className="font-bold text-orange-400">FIR(Country)</span></label>
                    </div>
                    </div>
                </div>
            )}

            {activeSubTab === 'section' && weatherTimes.length > 0 && (
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-4 text-xs z-20 shadow-md relative shrink-0">
                    <span className="font-bold text-sky-400 shrink-0">WIND/TEMP FCST TIME:</span>
                    <input type="range" min="0" max={weatherTimes.length - 1} value={timeIndex} onChange={e => setTimeIndex(Number(e.target.value))} className="flex-1 accent-sky-400 cursor-pointer" />
                    <span className="font-mono bg-slate-950 px-2 py-1 rounded border border-slate-700 w-16 text-center text-sky-300 font-bold shrink-0">{weatherTimes[timeIndex]}</span>
                    
                    <div className="border-l border-slate-700 h-6 mx-2"></div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white shrink-0 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        <input type="checkbox" checked={showTemp} onChange={(e) => setShowTemp(e.target.checked)} className="accent-rose-500 rounded" />
                        <span className="font-bold">SHOW: TEMP</span>
                    </label>
                </div>
            )}

            <div className="flex-1 relative overflow-hidden flex flex-col min-h-0 w-full">
                <div className={`absolute inset-0 flex flex-col ${activeSubTab === 'map' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
                    <WeatherRadarMap 
                        navlogData={navlogData} 
                        routeWps={routeWps} 
                        frameIndex={frameIndex} 
                        setFrameIndex={setFrameIndex} 
                        isPlaying={isPlaying} 
                        setIsPlaying={setIsPlaying} 
                        maxFrames={maxFrames} 
                        setMaxFrames={setMaxFrames} 
                        deviationNM={deviationNM}
                        setDeviationNM={setDeviationNM}
                        opacity={opacity}
                        setOpacity={setOpacity}
                        showHimawari={showHimawari}
                        setShowHimawari={setShowHimawari}
                        showGoesEast={showGoesEast}
                        setShowGoesEast={setShowGoesEast}
                        showGoesWest={showGoesWest}
                        setShowGoesWest={setShowGoesWest}
                        showMeteosat={showMeteosat}
                        setShowMeteosat={setShowMeteosat}
                        showPolar={showPolar}
                        setShowPolar={setShowPolar}
                        showRadar={showRadar}
                        setShowRadar={setShowRadar}
                        showNavlogRoute={showNavlogRoute}
                        setShowNavlogRoute={setShowNavlogRoute}
                        showAirspace={showAirspace}
                        setShowAirspace={setShowAirspace}
                        showFIR={showFIR}
                        setShowFIR={setShowFIR}
                        safeFrameIndex={safeFrameIndex}
                    />
                </div>
                {activeSubTab === 'section' && (
                    <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col pointer-events-auto">
                        {isLoadingWeather ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-sky-400 gap-3"><IconLoader2 className="animate-spin w-8 h-8" /><span className="font-bold">Fetching Weather Data...</span></div>
                        ) : (
                            <CrossSectionView routeData={routeWps} weatherData={weatherData} timeIndex={timeIndex} showTemp={showTemp} navlogData={navlogData} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};